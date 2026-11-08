from django.db.models import Q
from django.utils import timezone

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action

from .models import NotificationModel
from notification.serializer import NotificationSerializer

from utils.myPagination import MyPagination


class NotificationViewSet(ModelViewSet):

    queryset = NotificationModel.objects.all().order_by("-id")
    serializer_class = NotificationSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "title",
        "message",
        "sender__username",
        "recipient__username",
    ]

    ordering_fields = [
        "id",
        "created_at",
        "is_read",
        "notification_type",
    ]

    def get_queryset(self):
        """
        Return notifications belonging only to the logged-in user.
        """

        user = self.request.user

        return (
            NotificationModel.objects.filter(
                recipient=user
            )
            .select_related("sender", "recipient")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        """
        GET /notifications/

        Supports filtering by:
        - status_filter: read / unread / all
        - notification_type
        - workspace_id
        - project_id
        """

        queryset = self.filter_queryset(self.get_queryset())

        status_filter = request.query_params.get("status_filter")

        if status_filter == "unread":
            queryset = queryset.filter(is_read=False)

        elif status_filter == "read":
            queryset = queryset.filter(is_read=True)

        notification_type = request.query_params.get(
            "notification_type"
        )

        if notification_type:
            queryset = queryset.filter(
                notification_type=notification_type
            )

        workspace_id = request.query_params.get("workspace_id")

        if workspace_id:
            queryset = queryset.filter(
                workspace_id=workspace_id
            )

        project_id = request.query_params.get("project_id")

        if project_id:
            queryset = queryset.filter(
                project_id=project_id
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

    def retrieve(self, request, *args, **kwargs):
        """
        GET /notifications/{id}/
        """

        notification_instance = self.get_object()

        serializer = self.serializer_class(notification_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["GET"],
        url_path="unread-count",
    )
    def unread_count(self, request, *args, **kwargs):
        """
        GET /notifications/unread-count/
        """

        count = self.get_queryset().filter(
            is_read=False
        ).count()

        return Response(
            {
                "success": True,
                "data":{"unread_count": count}
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["PATCH"],
        url_path="mark-read",
    )
    def mark_read(self, request, *args, **kwargs):
        """
        PATCH /notifications/{id}/mark-read/
        """

        notification_instance = self.get_object()

        if not notification_instance.is_read:
            notification_instance.is_read = True
            notification_instance.read_at = timezone.now()

            notification_instance.save(
                update_fields=[
                    "is_read",
                    "read_at",
                ]
            )

        serializer = self.serializer_class(notification_instance)

        return Response(
            {
                "success": True,
                "message": "Notification marked as read successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["PATCH"],
        url_path="mark-all-read",
    )
    def mark_all_read(self, request, *args, **kwargs):
        """
        PATCH /notifications/mark-all-read/
        """

        updated_count = self.get_queryset().filter(
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now(),
        )

        return Response(
            {
                "success": True,
                "message": "All notifications marked as read successfully.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        DELETE /notifications/{id}/
        """

        notification_instance = self.get_object()

        notification_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Notification deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["DELETE"],
        url_path="clear-all",
    )
    def clear_all(self, request, *args, **kwargs):
        """
        DELETE /notifications/clear-all/
        """

        deleted_count, _ = self.get_queryset().delete()

        return Response(
            {
                "success": True,
                "message": "All notifications deleted successfully.",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )