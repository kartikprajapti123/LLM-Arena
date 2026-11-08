import json

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from chat.models import ConversationModel,ConversationParticipantModel
from workspace.models import (
    WorkspaceModel,
    WorkspaceMemberModel,
    WorkspaceInviteModel,
    WorkspaceCredentialModel,
)
from notification.models import NotificationModel
from real_time_connection.consumer import send_user_notification
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q

from django.db import transaction
from workspace.serailizer import (
    WorkspaceSerializer,
    WorkspaceMemberSerializer,
    WorkspaceInviteSerializer,
    WorkspaceCredentialSerializer,
)
from rest_framework.decorators import action
from utils.myPagination import MyPagination


class WorkspaceViewSet(ModelViewSet):
    queryset = WorkspaceModel.objects.all().order_by("-id")
    serializer_class = WorkspaceSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "name",
        "description",
        "owner__username",
    ]

    ordering_fields = [
        "id",
        "name",
        "created_at",
        "updated_at",
    ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.serializer_class(page, many=True)

            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        workspace_data = json.loads(request.data.get("workspace_data", "{}"))

        image = request.FILES.get("image")

        if image:
            workspace_data["image"] = image

        serializer = self.serializer_class(data=workspace_data, partial=True)

        if serializer.is_valid():
            with transaction.atomic():
                workspace_instance=serializer.save(owner=request.user)
                conversation = ConversationModel.objects.create(
                    workspace=workspace_instance,
                    conversation_type=ConversationModel.ConversationType.GROUP,
                    title=workspace_instance.name,  # change if your field is named differently
                    description=f"Chat for everyone in {workspace_instance.name}",
                    created_by=request.user,
                )

                ConversationParticipantModel.objects.create(
                    conversation=conversation,
                    user=request.user,
                    role=ConversationParticipantModel.ParticipantRole.ADMIN,
                )

            return Response(
                {
                    "success": True,
                    "message": "Workspace Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        workspace_instance = self.get_object()

        workspace_data = json.loads(request.data.get("workspace_data", "{}"))

        if "image" in request.FILES:
            workspace_data["image"] = request.FILES.get("image")
        print(workspace_data)
        serializer = self.serializer_class(
            workspace_instance, data=workspace_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Workspace Updated Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        workspace_instance = self.get_object()

        serializer = self.serializer_class(workspace_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        workspace_instance = self.get_object()

        if workspace_instance.image:
            workspace_instance.image.delete(save=False)

        workspace_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Workspace Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["POST"],
        url_path="get-single-workspace",
    )
    def get_single_workspace(self, request, *args, **kwargs):
        user = request.user

        workspace_instance = WorkspaceModel.objects.filter(owner=user.id).first()
        print(workspace_instance)
        if workspace_instance:
            serializer = self.serializer_class(instance=workspace_instance)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "success": False,
                "error": "Workspace not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )


class WorkspaceMemberViewSet(ModelViewSet):
    queryset = WorkspaceMemberModel.objects.all().order_by("-id")
    serializer_class = WorkspaceMemberSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "user__username",
        "user__email",
        "workspace__name",
        "role",
    ]

    ordering_fields = [
        "id",
        "user__user_name",
        "role",
        "created_at",
        "updated_at",
    ]

   
    def get_queryset(self):
        user = self.request.user
        workspace = WorkspaceModel.objects.filter(owner=user).first()

        # 2. If not, is the user an active member?
        if workspace is None:
            membership = (
                WorkspaceMemberModel.objects
                .filter(user=user, is_active=True)
                .select_related("workspace")
                .first()
            )
            workspace = membership.workspace if membership else None
    
        if workspace is None:
            raise PermissionDenied("You are not a member of any workspace.")
    
        return (
            WorkspaceMemberModel.objects
            .filter(workspace=workspace)
            .select_related("user", "workspace")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_filter = request.query_params.get("status_filter")
        role_filter = request.query_params.get("role_filter")

        if status_filter is not None:
            status_filter = status_filter.lower() == "true"
            queryset = queryset.filter(is_active=status_filter)

        if role_filter:
            queryset = queryset.filter(role=role_filter)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.serializer_class(page, many=True)

            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            with transaction.atomic():
                # Create the workspace membership
                workspace_member = serializer.save()

                workspace = workspace_member.workspace
                new_member = request.user

                # Get all active workspace members except the new member
                # Get all active workspace members except the new member
                member_ids = set(
                    WorkspaceMemberModel.objects
                    .filter(
                        workspace=workspace,
                        is_active=True,
                    )
                    .exclude(user_id=new_member.id)
                    .values_list("user_id", flat=True)
                )

                # Add workspace owner
                if workspace.owner_id and workspace.owner_id != new_member.id:
                    member_ids.add(workspace.owner_id)

                # Notify existing workspace members
                for member_id in member_ids:
                    notification = NotificationModel.objects.create(
                        recipient_id=member_id,
                        sender=new_member,
                        notification_type="member",
                        title="New Workspace Member",
                        message=(
                            f"{new_member.username} has joined "
                            f"the workspace {workspace.name}."
                        ),
                        data={
                            "event": "workspace_member_added",
                            "workspace_id": str(workspace.id),
                            "workspace_name": workspace.name,
                            "member_id": str(new_member.id),
                            "member_username": new_member.username,
                        },
                    )

                    # Send notification after the transaction commits
                    transaction.on_commit(
                        lambda notification=notification,
                        member_id=member_id: send_user_notification(
                            member_id,
                            {
                                "type": "notification",
                                "notification_id": str(notification.id),
                                "title": notification.title,
                                "message": notification.message,
                                "notification_type": (
                                    notification.notification_type
                                ),
                                "data": notification.data,
                                "is_read": notification.is_read,
                                "created_at": (
                                    notification.created_at.isoformat()
                                ),
                            },
                        )
                    )

            return Response(
                {
                    "success": True,
                    "message": "Workspace Member Added Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        member_instance = self.get_object()

        serializer = self.serializer_class(
            member_instance, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Workspace Member Updated Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        member_instance = self.get_object()

        serializer = self.serializer_class(member_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        member_instance = self.get_object()

        workspace = member_instance.workspace
        removed_member = member_instance.user

        workspace_id = str(workspace.id)
        workspace_name = workspace.name
        removed_member_id = str(removed_member.id)
        removed_member_username = removed_member.username

        with transaction.atomic():

            member_ids = set(
                WorkspaceMemberModel.objects.filter(
                    workspace=workspace,
                    is_active=True,
                )
                .exclude(user_id=member_instance.user_id)
                .exclude(user_id=request.user.id)
                .values_list("user_id", flat=True)
            )

            if (
                workspace.owner_id
                and workspace.owner_id != member_instance.user_id
                and workspace.owner_id != request.user.id
            ):
                member_ids.add(workspace.owner_id)

            for member_id in member_ids:
                notification = NotificationModel.objects.create(
                    recipient_id=member_id,
                    sender=request.user,
                    notification_type="member",
                    title="Workspace Member Removed",
                    message=(
                        f"{removed_member_username} has been removed "
                        f"from the workspace {workspace_name}."
                    ),
                    data={
                        "event": "workspace_member_removed",
                        "workspace_id": workspace_id,
                        "workspace_name": workspace_name,
                        "member_id": removed_member_id,
                        "member_username": removed_member_username,
                    },
                )

                transaction.on_commit(
                    lambda notification=notification,
                    member_id=member_id: send_user_notification(
                        member_id,
                        {
                            "type": "notification",
                            "notification_id": str(notification.id),
                            "title": notification.title,
                            "message": notification.message,
                            "notification_type": (
                                notification.notification_type
                            ),
                            "data": notification.data,
                            "is_read": notification.is_read,
                            "created_at": (
                                notification.created_at.isoformat()
                            ),
                        },
                    )
                )

            member_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Workspace Member Removed Successfully",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False, methods=["POST"], url_path="workspace-member-create-invite-code"
    )
    def workspace_member_create_invite_code(self, request, *args, **kwargs):
        invite_code = request.data.get("invite_code")

        if not invite_code:
            return Response(
                {"success": False, "error": "invite_code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace_invite_instance = WorkspaceInviteModel.objects.get(
                invite_code=invite_code
            )

        except WorkspaceInviteModel.DoesNotExist:
            return Response(
                {"success": False, "error": "No Workspace Found with this invite code"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_member_instance = WorkspaceMemberModel.objects.create(
            workspace=workspace_invite_instance.workspace,
            user=request.user,
        )
        workspace_invite_instance.is_active=False
        workspace_invite_instance.save()
        
        workspace = workspace_invite_instance.workspace

        with transaction.atomic():
            member, created = WorkspaceMemberModel.objects.get_or_create(
                workspace=workspace,
                user=request.user,
            )

            conversation = ConversationModel.objects.filter(
                workspace=workspace,
                is_active=True,
            ).first()

            if conversation:
                ConversationParticipantModel.objects.get_or_create(
                    conversation=conversation,
                    user=request.user,
                    defaults={
                        "role": ConversationParticipantModel.ParticipantRole.MEMBER,
                    },
                )

        return Response(
            {
                "success": True,
                "message": "You Joined workspace Successfully",
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceInviteViewSet(ModelViewSet):
    queryset = WorkspaceInviteModel.objects.all().order_by("-id")
    serializer_class = WorkspaceInviteSerializer
    pagination_class = MyPagination
    filter_backends = [SearchFilter, OrderingFilter]
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    search_fields = [
        "invite_code",
    ]

    ordering_fields = ["created_at"]

    def get_queryset(self):
        return WorkspaceInviteModel.objects.filter(
            workspace__owner=self.request.user
        ).order_by("-id")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_filter = request.query_params.get("statusFilter")
        if status_filter is not None:
            status_filter = status_filter.lower() == "true"
            print(type(status_filter))
            queryset = queryset.filter(is_active=status_filter)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)

            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
        
    def update(self, request, *args, **kwargs):
            instance = self.get_object()
    
            serializer = self.serializer_class(
                instance, data=request.data, partial=True
            )
    
            if serializer.is_valid():
                serializer.save()
    
                return Response(
                    {
                        "success": True,
                        "message": "Workspace Invite Updated Successfully",
                        "data": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
    
            first_field, first_error_list = next(iter(serializer.errors.items()))
    
            first_error = (
                first_error_list[0]
                if isinstance(first_error_list, list)
                else first_error_list
            )
    
            return Response(
                {
                    "success": False,
                    "error": first_error,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, *args, **kwargs):

        workspace_id = request.data.get("workspace")

        if not workspace_id:
            return Response(
                {"success": False, "error": "Workspace is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_exists = request.user.owned_workspaces.filter(
            id=workspace_id
        ).exists()

        if not workspace_exists:
            return Response(
                {
                    "success": False,
                    "error": "You do not have permission to create an invitation for this workspace.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Workspace invitation created successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):

        invite = self.get_object()

        serializer = self.serializer_class(invite)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):

        invite = self.get_object()

        invite.is_active = False
        invite.save(update_fields=["is_active"])

        return Response(
            {
                "success": True,
                "message": "Workspace invitation deactivated successfully.",
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceCredentialViewSet(ModelViewSet):

    queryset = WorkspaceCredentialModel.objects.all().order_by("-id")

    serializer_class = WorkspaceCredentialSerializer

    authentication_classes = [JWTAuthentication]

    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter]

    pagination_class = MyPagination

    search_fields = [
        "workspace__name",
        "provider__name",
    ]

    ordering_fields = [
        "id",
        "created_at",
        "updated_at",
        "is_active",
    ]

    def get_queryset(self):

        user = self.request.user

        return (
            WorkspaceCredentialModel.objects.filter(
                workspace__members__user=user, workspace__members__is_active=True
            )
            .distinct()
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):

        queryset = self.filter_queryset(self.get_queryset())
        status_filter = request.query_params.get("statusFilter")
        if status_filter is not None:
            status_filter = status_filter.lower() == "true"
            print(type(status_filter))
            queryset = queryset.filter(is_active=status_filter)
                    
                    
        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = self.get_serializer(page, many=True)

            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            first_field, first_error_list = next(iter(serializer.errors.items()))
            
            first_error = (
                        first_error_list[0]
                        if isinstance(first_error_list, list)
                        else first_error_list
                    )
            return Response(
                {"success": False, "error": first_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = serializer.validated_data.get("workspace")

        # Check if user belongs to the workspace
        is_member = workspace.members.filter(user=request.user, is_active=True).exists()

        if not is_member:

            return Response(
                {"success": False, "error": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only workspace admins can manage credentials
        is_admin = workspace.members.filter(
            user=request.user, role="admin", is_active=True
        ).exists()

        if not is_admin:

            return Response(
                {
                    "success": False,
                    "error": "Only workspace admins can manage credentials.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        credential = serializer.save()

        return Response(
            {"success": True, "data": self.get_serializer(credential).data},
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):

        credential = self.get_object()

        serializer = self.get_serializer(credential)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):

        credential = self.get_object()

        workspace = credential.workspace

        is_admin = workspace.members.filter(
            user=request.user, role="admin", is_active=True
        ).exists()

        if not is_admin:

            return Response(
                {
                    "success": False,
                    "error": "Only workspace admins can manage credentials.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)

        serializer = self.get_serializer(credential, data=request.data, partial=partial)

        if not serializer.is_valid():
            first_field, first_error_list = next(iter(serializer.errors.items()))
            
            first_error = (
                        first_error_list[0]
                        if isinstance(first_error_list, list)
                        else first_error_list
                    )
            return Response(
                {"success": False, "error": first_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential = serializer.save()

        return Response(
            {"success": True, "data": self.get_serializer(credential).data},
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, *args, **kwargs):

        kwargs["partial"] = True

        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        credential = self.get_object()

        workspace = credential.workspace

        is_admin = workspace.members.filter(
            user=request.user, role="admin", is_active=True
        ).exists()

        if not is_admin:

            return Response(
                {
                    "success": False,
                    "error": "Only workspace admins can manage credentials.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        credential.delete()

        return Response(
            {"success": True, "message": "Workspace credential deleted successfully."},
            status=status.HTTP_200_OK,
        )
