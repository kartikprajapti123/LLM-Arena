
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    ConversationModel,
    ConversationParticipantModel,
    ChatMessageModel,
)

User = get_user_model()


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.id")
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = ConversationParticipantModel
        fields = [
            "id",
            "user_id",
            "username",
            "profile_image",
            "role",
            "joined_at",
            "last_read_at",
            "is_muted",
            "is_archived",
        ]
        read_only_fields = fields

    def get_profile_image(self, obj):
        user = obj.user

        if not user or not user.profile_image:
            return None

        request = self.context.get("request")
        image_url = user.profile_image.url

        if request:
            return request.build_absolute_uri(image_url)

        return image_url


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.ReadOnlyField(source="sender.id")
    sender_username = serializers.SerializerMethodField()
    sender_profile_image = serializers.SerializerMethodField()
    conversation_id = serializers.UUIDField(read_only=True)
    reply_to_id = serializers.UUIDField(
        read_only=True,
        allow_null=True,
    )
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessageModel
        fields = [
            "id",
            "conversation_id",
            "sender_id",
            "sender_username",
            "attachment",
            
            "sender_profile_image",
            "message_type",
            "content",
            "attachment_url",
            "reply_to_id",
            "created_at",
            "updated_at",
            "is_edited",
            "edited_at",
            "is_deleted",
            "deleted_at",
        ]
        read_only_fields = [
            "id",
            "conversation_id",
            "sender_id",
            "sender_username",
            "sender_profile_image",
            "attachment_url",
            "reply_to_id",
            "created_at",
            "updated_at",
            "is_edited",
            "edited_at",
            "is_deleted",
            "deleted_at",
        ]

    def get_sender_username(self, obj):
        if obj.sender:
            return obj.sender.username
        return None

    def get_sender_profile_image(self, obj):
        if not obj.sender or not obj.sender.profile_image:
            return None

        image_url = obj.sender.profile_image.url
        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(image_url)

        return image_url

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None

        request = self.context.get("request")
        url = obj.attachment.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def validate(self, attrs):
        message_type = attrs.get(
            "message_type",
            ChatMessageModel.MessageType.TEXT,
        )
        content = attrs.get("content", "")
        attachment = attrs.get("attachment")
        print(content,attachment)
        if not content.strip() and not attachment:
            raise serializers.ValidationError(
                "A message must contain text or an attachment."
            )

        if (
            message_type == ChatMessageModel.MessageType.TEXT
            and not content.strip()
        ):
            raise serializers.ValidationError({
                "content": "Text messages cannot be empty."
            })

        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(
        source="participant_records",
        many=True,
        read_only=True,
    )

    last_message = ChatMessageSerializer(read_only=True)

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = ConversationModel
        fields = [
            "id",
            "workspace",
            "conversation_type",
            "title",
            "description",
            "avatar",
            "created_by",
            "created_by_username",
            "participants",
            "last_message",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_username",
            "participants",
            "last_message",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        conversation_type = attrs.get(
            "conversation_type",
            getattr(
                self.instance,
                "conversation_type",
                ConversationModel.ConversationType.DIRECT,
            ),
        )

        title = attrs.get(
            "title",
            getattr(self.instance, "title", ""),
        )

        if (
            conversation_type == ConversationModel.ConversationType.GROUP
            and not title.strip()
        ):
            raise serializers.ValidationError({
                "title": "Group conversations require a title."
            })

        return attrs
