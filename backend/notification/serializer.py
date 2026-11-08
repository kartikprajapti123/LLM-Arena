from rest_framework import serializers

from .models import NotificationModel


class NotificationSerializer(serializers.ModelSerializer):

    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = NotificationModel

        fields = [
            "id",
            "recipient",
            "sender",
            "sender_name",
            "notification_type",
            "title",
            "message",
            "workspace_id",
            "project_id",
            "data",
            "is_read",
            "read_at",
            "created_at",
        ]

        read_only_fields = fields

    def get_sender_name(self, obj):
        if not obj.sender:
            return None

        return (
            getattr(obj.sender, "username", None)
            or getattr(obj.sender, "email", None)
        )