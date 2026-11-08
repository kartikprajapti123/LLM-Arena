from django.conf import settings
from django.db import models


class NotificationModel(models.Model):

    TYPE_CHOICES = [
        ("workspace", "Workspace"),
        ("workspace_invite", "Workspace Invitation"),
        ("member", "Workspace Member"),
        ("project", "Project"),
        ("model", "LLM Model"),
        ("comparison", "Comparison"),
        ("chat", "Chat"),
        ("system", "System"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_notifications",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        db_index=True,
    )

    title = models.CharField(max_length=255)
    message = models.TextField()

    workspace_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
    )

    project_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
    )

    data = models.JSONField(default=dict, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["recipient", "is_read", "-created_at"],
                name="notif_rec_read_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient_id}"