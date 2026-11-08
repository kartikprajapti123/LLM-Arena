
import uuid

from django.conf import settings
from django.db import models


class ConversationModel(models.Model):

    class ConversationType(models.TextChoices):
        DIRECT = "direct", "Direct Message"
        GROUP = "group", "Group Chat"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    workspace = models.ForeignKey(
        "workspace.WorkspaceModel",
        on_delete=models.CASCADE,
        related_name="conversations",
    )

    conversation_type = models.CharField(
        max_length=10,
        choices=ConversationType.choices,
        default=ConversationType.DIRECT,
    )

    title = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    description = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    avatar = models.ImageField(
        upload_to="chat/conversations/",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_conversations",
    )

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ConversationParticipantModel",
        related_name="chat_conversations",
        blank=True,
    )

    last_message = models.ForeignKey(
        "ChatMessageModel",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(
                fields=["workspace", "-updated_at"],
                name="chat_workspace_updated_idx",
            ),
        ]

    def __str__(self):
        return self.title or f"{self.conversation_type} - {self.pk}"


class ConversationParticipantModel(models.Model):

    class ParticipantRole(models.TextChoices):
        MEMBER = "member", "Member"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    conversation = models.ForeignKey(
        ConversationModel,
        on_delete=models.CASCADE,
        related_name="participant_records",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_memberships",
    )

    role = models.CharField(
        max_length=10,
        choices=ParticipantRole.choices,
        default=ParticipantRole.MEMBER,
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    last_read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_muted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                name="chat_unique_participant",
            ),
        ]
        indexes = [
            models.Index(
                fields=["user", "conversation"],
                name="chat_user_conversation_idx",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.conversation_id}"


class ChatMessageModel(models.Model):

    class MessageType(models.TextChoices):
        TEXT = "text", "Text"
        IMAGE = "image", "Image"
        FILE = "file", "File"
        SYSTEM = "system", "System"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    conversation = models.ForeignKey(
        ConversationModel,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_chat_messages",
    )

    message_type = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )

    content = models.TextField(
        max_length=5000,
        blank=True,
        default="",
    )

    attachment = models.FileField(
        upload_to="chat/attachments/",
        null=True,
        blank=True,
    )

    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="chat_message_history_idx",
            ),
        ]

    def __str__(self):
        return f"Message {self.pk}"
