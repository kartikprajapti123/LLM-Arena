from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import F, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import (
    ConversationModel,
    ConversationParticipantModel,
    ChatMessageModel,
)
from chat.serializer import (
    ConversationSerializer,
    ConversationParticipantSerializer,
    ChatMessageSerializer,
)

# Import MyPagination from the same location used in your ComparisonViewSet.
from utils.myPagination import MyPagination

UserModel = get_user_model()


class ConversationViewSet(ModelViewSet):
    serializer_class = ConversationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = MyPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        return (
            ConversationModel.objects.filter(
                participants=self.request.user,
                is_active=True,
            )
            .select_related(
                "workspace",
                "created_by",
                "last_message",
                "last_message__sender",
            )
            .prefetch_related(
                Prefetch(
                    "participant_records",
                    queryset=ConversationParticipantModel.objects.select_related(
                        "user"
                    ),
                )
            )
            .distinct()
        )

    def check_workspace_access(self, workspace):
        is_owner = workspace.owner_id == self.request.user.id

        is_member = workspace.members.filter(
            user=self.request.user,
            is_active=True,
        ).exists()

        if not is_owner and not is_member:
            return False

        return True

    def check_conversation_access(self, conversation):
        if not conversation.participants.filter(id=self.request.user.id).exists():
            return False

        return True

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)

            if page is not None:
                serializer = self.get_serializer(
                    page,
                    many=True,
                )

                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(
                queryset,
                many=True,
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request, *args, **kwargs):
        try:
            workspace_id = request.data.get("workspace")
            conversation_type = request.data.get(
                "conversation_type",
                ConversationModel.ConversationType.DIRECT,
            )
            participant_ids = request.data.get("participant_ids", [])

            # Validate workspace
            if not workspace_id:
                return Response(
                    {
                        "success": False,
                        "error": "Workspace is required.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = get_object_or_404(
                ConversationModel._meta.get_field("workspace").remote_field.model,
                id=workspace_id,
            )

            # Check workspace access
            if not self.check_workspace_access(workspace):
                return Response(
                    {
                        "success": False,
                        "error": "You do not have access to this workspace.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Validate conversation type
            if conversation_type not in (
                ConversationModel.ConversationType.DIRECT,
                ConversationModel.ConversationType.GROUP,
            ):
                return Response(
                    {
                        "success": False,
                        "error": "Invalid conversation type.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Include the current user in the participant list.
            try:
                participant_ids = {
                    int(participant_id) for participant_id in (participant_ids or [])
                }
            except (TypeError, ValueError):
                return Response(
                    {
                        "success": False,
                        "error": "Invalid participant ID.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            participant_ids.add(request.user.id)

            # Validate the number of participants.
            if conversation_type == ConversationModel.ConversationType.DIRECT:

                # Find direct conversations in this workspace that include the current user.
                existing_conversation_ids = (
                    ConversationParticipantModel.objects.filter(
                        user_id=request.user.id,
                        conversation__workspace=workspace,
                        conversation__conversation_type=(
                            ConversationModel.ConversationType.DIRECT
                        ),
                        conversation__is_active=True,
                    )
                    .values_list("conversation_id", flat=True)
                    .distinct()
                )

                # Compare the exact participants of each existing conversation.
                existing_conversations = ConversationModel.objects.filter(
                    id__in=existing_conversation_ids,
                    workspace=workspace,
                    conversation_type=ConversationModel.ConversationType.DIRECT,
                    is_active=True,
                )

                for existing in existing_conversations:

                    existing_ids = set(
                        ConversationParticipantModel.objects.filter(
                            conversation=existing
                        ).values_list("user_id", flat=True)
                    )

                    if existing_ids == participant_ids:
                        serializer = self.get_serializer(existing)

                        return Response(
                            {
                                "success": True,
                                "message": "Direct conversation already exists.",
                                "data": serializer.data,
                            },
                            status=status.HTTP_200_OK,
                        )

            if (
                conversation_type == ConversationModel.ConversationType.GROUP
                and len(participant_ids) < 3
            ):
                return Response(
                    {
                        "success": False,
                        "error": (
                            "A group conversation requires at least "
                            "three participants, including you."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Ensure every participant belongs to this workspace.
            workspace_member_ids = set(
                workspace.members.filter(
                    is_active=True,
                ).values_list("user_id", flat=True)
            )

            # Include the workspace owner.
            workspace_member_ids.add(workspace.owner_id)

            if not participant_ids.issubset(workspace_member_ids):
                return Response(
                    {
                        "success": False,
                        "error": (
                            "All participants must be active members "
                            "of this workspace."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate that all users exist.
            participants = list(UserModel.objects.filter(id__in=participant_ids))

            if len(participants) != len(participant_ids):
                return Response(
                    {
                        "success": False,
                        "error": "One or more participants do not exist.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():

                # Check whether an exact direct conversation already exists.
                if conversation_type == ConversationModel.ConversationType.DIRECT:
                    existing_conversations = (
                        ConversationModel.objects.filter(
                            workspace=workspace,
                            conversation_type=(
                                ConversationModel.ConversationType.DIRECT
                            ),
                            is_active=True,
                            participants__id=request.user.id,
                        )
                        .annotate(
                            participant_count=Count(
                                "participants",
                                distinct=True,
                            )
                        )
                        .filter(participant_count=2)
                        .distinct()
                    )

                    for existing in existing_conversations:
                        existing_ids = set(
                            existing.participants.values_list(
                                "id",
                                flat=True,
                            )
                        )

                        # Compare the exact participant IDs.
                        if existing_ids == participant_ids:
                            serializer = self.get_serializer(existing)

                            return Response(
                                {
                                    "success": True,
                                    "message": ("Direct conversation already exists."),
                                    "data": serializer.data,
                                },
                                status=status.HTTP_200_OK,
                            )

                # Create a new conversation if no exact match exists.
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)

                conversation = serializer.save(
                    workspace=workspace,
                    created_by=request.user,
                    conversation_type=conversation_type,
                )

                # Create participant records.
                ConversationParticipantModel.objects.bulk_create(
                    [
                        ConversationParticipantModel(
                            conversation=conversation,
                            user=participant,
                            role=(
                                ConversationParticipantModel.ParticipantRole.ADMIN
                                if participant.id == request.user.id
                                else ConversationParticipantModel.ParticipantRole.MEMBER
                            ),
                        )
                        for participant in participants
                    ]
                )

            # Fetch the conversation with the viewset's queryset.
            conversation = self.get_queryset().get(id=conversation.id)
            serializer = self.get_serializer(conversation)

            return Response(
                {
                    "success": True,
                    "message": "Conversation created successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": e.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, *args, **kwargs):
        try:
            conversation = self.get_object()
            serializer = self.get_serializer(conversation)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop("partial", False)
            conversation = self.get_object()

            participant = conversation.participant_records.filter(
                user=request.user
            ).first()

            if not participant or participant.role != (
                ConversationParticipantModel.ParticipantRole.ADMIN
            ):
                return Response(
                    {
                        "success": False,
                        "error": "You are not allowed to update this conversation.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = self.get_serializer(
                conversation,
                data=request.data,
                partial=partial,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Conversation updated successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": e.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            conversation = self.get_object()

            participant = conversation.participant_records.filter(
                user=request.user
            ).first()

            if not participant or participant.role != (
                ConversationParticipantModel.ParticipantRole.ADMIN
            ):
                return Response(
                    {
                        "success": False,
                        "error": "You are not allowed to delete this conversation.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Soft-delete the conversation so its message history remains.
            conversation.is_active = False
            conversation.save(update_fields=["is_active", "updated_at"])

            return Response(
                {
                    "success": True,
                    "message": "Conversation deleted successfully.",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["POST"], url_path="direct")
    def direct(self, request):
        """
        Create or retrieve a one-to-one conversation.

        POST /conversations/direct/
        {
            "workspace": "workspace-uuid",
            "participant_ids": ["other-user-id"]
        }
        """
        data = request.data.copy()
        participant_ids = data.get("participant_ids", [])

        if len(participant_ids) != 1:
            return Response(
                {
                    "success": False,
                    "error": "Provide exactly one other participant.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["conversation_type"] = ConversationModel.ConversationType.DIRECT

        # Reuse the same creation and permission logic.
        request._full_data = data
        return self.create(request)

    @action(detail=True, methods=["GET"], url_path="messages")
    def messages(self, request, pk=None):
        try:
            conversation = self.get_object()

            messages = (
                ChatMessageModel.objects.filter(
                    conversation=conversation,
                )
                .select_related("sender", "reply_to")
                .order_by("-created_at", "-id")
            )

            page = self.paginate_queryset(messages)

            if page is not None:
                serializer = ChatMessageSerializer(
                    page,
                    many=True,
                    context={"request": request},
                )
                return self.get_paginated_response(serializer.data)

            serializer = ChatMessageSerializer(
                messages,
                many=True,
                context={"request": request},
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["POST"], url_path="send-message")
    def send_message(self, request, pk=None):
        try:
            conversation = self.get_object()
            print(request.data)
            serializer = ChatMessageSerializer(
                data=request.data,
                context={"request": request},
            )
            serializer.is_valid(raise_exception=True)

            message = serializer.save(
                conversation=conversation,
                sender=request.user,
            )

            conversation.last_message = message
            conversation.save(update_fields=["last_message", "updated_at"])

            return Response(
                {
                    "success": True,
                    "message": "Message sent successfully.",
                    "data": ChatMessageSerializer(
                        message,
                        context={"request": request},
                    ).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": e.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["POST"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        try:
            conversation = self.get_object()

            ConversationParticipantModel.objects.filter(
                conversation=conversation,
                user=request.user,
            ).update(last_read_at=timezone.now())

            return Response(
                {
                    "success": True,
                    "message": "Conversation marked as read.",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=False,
        methods=["post"],
        url_path="unread-count",
        permission_classes=[IsAuthenticated],
    )
    def unread_count(self, request):
        user = request.user

        unread_count = (
            ChatMessageModel.objects.filter(
                conversation__participants=user,
                conversation__is_active=True,
                conversation__participant_records__is_archived=False,
                is_deleted=False,
            )
            .exclude(sender=user)
            .filter(
                Q(
                    conversation__participant_records__user=user,
                    conversation__participant_records__last_read_at__isnull=True,
                )
                | Q(
                    conversation__participant_records__user=user,
                    conversation__participant_records__last_read_at__lt=F("created_at"),
                )
            )
            .count()
        )

        data = {"unread_count": unread_count}
        return Response(
            {"success": True, "data": data},
            status=status.HTTP_200_OK,
        )
