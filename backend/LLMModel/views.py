import json

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from workspace.models import WorkspaceModel
from notification.models import NotificationModel
from LLMModel.models import LLMModelModel
from LLMModel.serializer import LLMModelSerializer
from real_time_connection.consumer import send_user_notification
from utils.myPagination import MyPagination


class LLMModelViewSet(ModelViewSet):
    queryset = LLMModelModel.objects.all().order_by("-id")
    serializer_class = LLMModelSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "name",
        "model_identifier",
        "description",
        "provider__name",
    ]

    ordering_fields = [
        "id",
        "name",
        "model_identifier",
        "context_window",
        "is_active",
        "created_at",
        "updated_at",
    ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        status_filter = request.query_params.get("statusFilter")
        if status_filter:
            queryset = queryset.filter(is_active=status_filter.lower() == "true")
        provider_id = request.query_params.get("provider")
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)

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
        raw_data = request.data.get("model_data")
        if raw_data:
            model_data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        else:
            model_data = request.data

        serializer = self.serializer_class(data=model_data, partial=True)

        if serializer.is_valid():
            with transaction.atomic():
                # Create LLM model
                model = serializer.save()

                # Get all workspace owners
                owner_ids = (
                    WorkspaceModel.objects
                    .filter(owner__isnull=False)
                    .values_list("owner_id", flat=True)
                    .distinct()
                )

                # Create and send notifications
                for owner_id in owner_ids:
                    notification = NotificationModel.objects.create(
                        recipient_id=owner_id,
                        sender=request.user,
                        notification_type="system",
                        title="New LLM Model Available",
                        message=(
                            f"{model.name} has been added to LLM Arena. "
                            "You can now use this model for your comparisons."
                        ),
                        data={
                            "event": "llm_model_created",
                            "model_id": str(model.id),
                            "model_name": model.name,
                        },
                    )

                    # Send notification after the transaction commits
                    transaction.on_commit(
                        lambda notification=notification, owner_id=owner_id: (
                            send_user_notification(
                                owner_id,
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
                    )

            return Response(
                {
                    "success": True,
                    "message": "LLM Model Created Successfully",
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
        model_instance = self.get_object()

        raw_data = request.data.get("model_data")
        if raw_data:
            model_data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        else:
            model_data = request.data

        serializer = self.serializer_class(
            model_instance, data=model_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "LLM Model Updated Successfully",
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
        model_instance = self.get_object()

        serializer = self.serializer_class(model_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        model_instance = self.get_object()
    
        # Capture model details before deletion
        model_id = str(model_instance.id)
        model_name = model_instance.name
    
        with transaction.atomic():
            # Get all workspace owners
            owner_ids = (
                WorkspaceModel.objects
                .filter(owner__isnull=False)
                .values_list("owner_id", flat=True)
                .distinct()
            )
    
            # Create notifications for all workspace owners
            for owner_id in owner_ids:
                notification = NotificationModel.objects.create(
                    recipient_id=owner_id,
                    sender=request.user,
                    notification_type="model",
                    title="LLM Model Deleted",
                    message=(
                        f"{model_name} has been removed from LLM Arena."
                    ),
                    data={
                        "event": "llm_model_deleted",
                        "model_id": model_id,
                        "model_name": model_name,
                    },
                )
    
                # Send real-time notification after transaction commits
                transaction.on_commit(
                    lambda notification=notification, owner_id=owner_id: (
                        send_user_notification(
                            owner_id,
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
                )
    
            # Delete the LLM model
            model_instance.delete()
    
        return Response(
            {
                "success": True,
                "message": "LLM Model Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )