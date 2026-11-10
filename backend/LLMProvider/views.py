import json

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from LLMProvider.models import LLMProviderModel
from LLMProvider.serializer import LLMProviderSerializer
from real_time_connection.consumer import send_multiple_user_notifications,send_user_notification
from workspace.models import WorkspaceModel
from utils.myPagination import MyPagination
from notification.models import NotificationModel

class LLMProviderViewSet(ModelViewSet):
    queryset = LLMProviderModel.objects.all().order_by("-id")
    serializer_class = LLMProviderSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "name",
        "slug",
        "website",
        "description",
    ]

    ordering_fields = [
        "id",
        "name",
        "slug",
        "is_active",
        "created_at",
        "updated_at",
    ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_filter = request.query_params.get("statusFilter")
        no_pagination = request.query_params.get("no_pagination")

        if status_filter:
            queryset = queryset.filter(is_active=status_filter.lower() == "true")

        if no_pagination:
            serializer = self.serializer_class(queryset, many=True)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
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
        raw_data = request.data.get("provider_data")
        if raw_data:
            provider_data = (
                json.loads(raw_data) if isinstance(raw_data, str) else raw_data
            )
        else:
            provider_data = request.data

        serializer = self.serializer_class(data=provider_data, partial=True)

        if serializer.is_valid():
            with transaction.atomic():
                provider = serializer.save()
                print(1)
                # Get all workspace owners
                owner_ids = (
                    WorkspaceModel.objects
                    .filter(owner__isnull=False)
                    .values_list("owner_id", flat=True)
                    .distinct()
                )
                
                print(owner_ids)
                # Create and send notifications
                for owner_id in owner_ids:

                    notification = NotificationModel.objects.create(
                        recipient_id=owner_id,
                        sender=request.user,
                        notification_type="system",
                        title="New LLM Provider Available",
                        message=(
                            f"{provider.name} has been added to LLM Arena. "
                            "You can now use this provider for your comparisons."
                        ),
                        data={
                            "event": "llm_provider_created",
                            "provider_id": str(provider.id),
                            "provider_name": provider.name,
                        },
                    )
                    print(3)

                    # Send notification after the database transaction commits
                    transaction.on_commit(
                        lambda notification=notification, owner_id=owner_id: (
                            send_user_notification(
                                owner_id,
                                {
                                    "type": "notification",
                                    "notification_id": str(notification.id),
                                    "title": notification.title,
                                    "message": notification.message,
                                    "notification_type": notification.notification_type,
                                    "data": notification.data,
                                    "is_read": notification.is_read,
                                    "created_at": notification.created_at.isoformat(),
                                },
                            )
                        )
                    )

            return Response(
                {
                    "success": True,
                    "message": "LLM Provider Created Successfully",
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
        provider_instance = self.get_object()

        raw_data = request.data.get("provider_data")
        if raw_data:
            provider_data = (
                json.loads(raw_data) if isinstance(raw_data, str) else raw_data
            )
        else:
            provider_data = request.data

        serializer = self.serializer_class(
            provider_instance, data=provider_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "LLM Provider Updated Successfully",
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
        provider_instance = self.get_object()

        serializer = self.serializer_class(provider_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        provider_instance = self.get_object()

        # Capture provider details before deletion
        provider_id = str(provider_instance.id)
        provider_name = provider_instance.name

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
                    notification_type="system",
                    title="LLM Provider Deleted",
                    message=(
                        f"{provider_name} has been removed from LLM Arena."
                    ),
                    data={
                        "event": "llm_provider_deleted",
                        "provider_id": provider_id,
                        "provider_name": provider_name,
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

            # Delete the provider
            provider_instance.delete()

        return Response(
            {
                "success": True,
                "message": "LLM Provider Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )