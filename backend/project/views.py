import json

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from user.models import UserModel
from project.models import ProjectModel
from project.serializer import ProjectSerializer
from workspace.models import WorkspaceMemberModel,WorkspaceModel
from utils.myPagination import MyPagination
from django.db import transaction
from notification.models import NotificationModel
from workspace.models import WorkspaceMemberModel
from real_time_connection.consumer import send_user_notification

class ProjectViewSet(ModelViewSet):
    queryset = ProjectModel.objects.all().order_by("-id")
    serializer_class = ProjectSerializer

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
        "workspace__name",
        "owner__username",
    ]

    ordering_fields = [
        "id",
        "name",
        "is_active",
        "is_created",
        "is_updated",
    ]
    
    def get_queryset(self):
        user = self.request.user

        return (
            ProjectModel.objects.filter(
                Q(workspace__owner=user)
                | Q(
                    workspace__members__user=user,
                    workspace__members__is_active=True,
                )
            )
            .order_by("-id")
            .distinct()
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_filter = request.query_params.get("status_filter")
        if status_filter:
            queryset = queryset.filter(is_active=status_filter == "true")
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
        project_data = json.loads(
            request.data.get("project_data", "{}")
        )

        image = request.FILES.get("image")

        if image:
            project_data["image"] = image

        serializer = self.serializer_class(
            data=project_data,
            partial=True
        )

        if serializer.is_valid():
            with transaction.atomic():
                project = serializer.save(owner=request.user)

                # Get the workspace associated with this project
                workspace = project.workspace

                # Get active workspace members, excluding the creator
                member_ids = (
                    WorkspaceMemberModel.objects
                    .filter(
                        workspace=workspace,
                        is_active=True,
                    )
                    .exclude(user_id=request.user.id)
                    .values_list("user_id", flat=True)
                    .distinct()
                )

                # Create notifications for workspace members
                for member_id in member_ids:
                    notification = NotificationModel.objects.create(
                        recipient_id=member_id,
                        sender=request.user,
                        notification_type="project",
                        title="New Project Created",
                        message=(
                            f"{project.name} has been created "
                            f"in the workspace {workspace.name}."
                        ),
                        data={
                            "event": "project_created",
                            "project_id": str(project.id),
                            "project_name": project.name,
                            "workspace_id": str(workspace.id),
                            "workspace_name": workspace.name,
                        },
                    )

                    # Send notification after transaction commits
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
                    "message": "Project Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(
            iter(serializer.errors.items())
        )

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
        project_instance = self.get_object()

        project_data = json.loads(request.data.get("project_data", "{}"))

        if "image" in request.FILES:
            project_data["image"] = request.FILES.get("image")

        serializer = self.serializer_class(
            project_instance, data=project_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Project Updated Successfully",
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
        project_instance = self.get_object()

        serializer = self.serializer_class(project_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        project_instance = self.get_object()

        # Capture project details before deletion
        project_id = str(project_instance.id)
        project_name = project_instance.name
        workspace = project_instance.workspace

        with transaction.atomic():
            # Get active members of this workspace, excluding the requester
            member_ids = (
                WorkspaceMemberModel.objects
                .filter(
                    workspace=workspace,
                    is_active=True,
                )
                .exclude(user_id=request.user.id)
                .values_list("user_id", flat=True)
                .distinct()
            )

            # Create notifications for workspace members
            for member_id in member_ids:
                notification = NotificationModel.objects.create(
                    recipient_id=member_id,
                    sender=request.user,
                    notification_type="project",
                    title="Project Deleted",
                    message=(
                        f"{project_name} has been deleted "
                        f"from the workspace {workspace.name}."
                    ),
                    data={
                        "event": "project_deleted",
                        "project_id": project_id,
                        "project_name": project_name,
                        "workspace_id": str(workspace.id),
                        "workspace_name": workspace.name,
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

            if project_instance.image:
                project_instance.image.delete(save=False)

            project_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Project Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )
    




    @action(detail=False, methods=["POST"], url_path="user-check")
    def user_check(self, request, *args, **kwargs):
        user = request.data.get("user")
        project = request.data.get("project")

        if not user:
            return Response({
                "success": False,
                "error": "User is required for checking."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not project:
            return Response({
                "success": False,
                "error": "Project is required for checking."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_instance = UserModel.objects.get(id=user)
        except UserModel.DoesNotExist:
            return Response({
                "success": False,
                "error": "User does not exist."
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            project_instance = ProjectModel.objects.select_related(
                "workspace"
            ).get(id=project)
        except ProjectModel.DoesNotExist:
            return Response({
                "success": False,
                "error": "Project does not exist."
            }, status=status.HTTP_404_NOT_FOUND)

        # Get workspace from project
        workspace_instance = project_instance.workspace

        # Check workspace owner
        if workspace_instance.owner == user_instance:
            return Response({
                "success": True,
                "is_owner": True,
                "is_member": True,
                "message": "User is the workspace owner."
            }, status=status.HTTP_200_OK)

        # Check workspace membership
        is_member = WorkspaceMemberModel.objects.filter(
            workspace=workspace_instance,
            user=user_instance
        ).exists()

        if is_member:
            return Response({
                "success": True,
                "is_owner": False,
                "is_member": True,
                "message": "User is a workspace member."
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "is_owner": False,
            "is_member": False,
            "error": "User is not a member of this workspace."
        }, status=status.HTTP_200_OK)