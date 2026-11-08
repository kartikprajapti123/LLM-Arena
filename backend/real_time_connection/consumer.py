import logging
import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from chat.models import ConversationParticipantModel
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
logger = logging.getLogger(__name__)


class LLMUpdateConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.group_name = f"project_{self.project_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "project_id": self.project_id,
            "message": "WebSocket connected successfully.",
        })
        logger.info("WebSocket connected to project %s", self.project_id)

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type")

        if message_type == "ping":
            await self.send_json({"type": "pong", "message": "WebSocket is working."})
            return

        await self.send_json({"type": "error", "message": "Unsupported message type."})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(
            "WebSocket disconnected from project %s",
            getattr(self, "project_id", None),
        )

    async def comparison_update(self, event):
        await self.send_json(event["data"])


class ConversationConsumer(AsyncJsonWebsocketConsumer):
    """
    Client -> server:
      {"type": "typing", "is_typing": true}      keep-alive while the user types
      {"type": "read"}                           the user has read the conversation
      {"type": "chat_message", "data": {...}}    broadcast an already-saved message

    Server -> client:
      {"type": "connection_established", ...}
      {"type": "typing", "user_id", "username", "is_typing": true, "conversation_id"}
      {"type": "read_receipt", "user_id", "username", "read_at", "conversation_id"}
      {"type": "chat_message", "data": {...}}
      {"type": "error", "message": "..."}
    """

    async def connect(self):
        try:
            self.conversation_id = uuid.UUID(
                str(self.scope["url_route"]["kwargs"]["conversation_id"])
            )
        except (ValueError, TypeError, AttributeError):
            await self.close(code=4000)
            return

        self.user = self.scope["user"]
        self.group_name = f"conversation_{self.conversation_id.hex}"

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        if not await self.is_participant():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "conversation_id": str(self.conversation_id),
        })

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "typing":
            # Only "typing started" is forwarded. Receivers expire it on their own,
            # so no explicit stop event is needed.
            if content.get("is_typing"):
                await self.channel_layer.group_send(self.group_name, {
                    "type": "typing_event",
                    "user_id": str(self.user.id),
                    "username": self.user.username,
                    "conversation_id": str(self.conversation_id),
                })
            return

        if msg_type == "read":
            await self.channel_layer.group_send(self.group_name, {
                "type": "read_event",
                "user_id": str(self.user.id),
                "username": self.user.username,
                "read_at": timezone.now().isoformat(),
                "conversation_id": str(self.conversation_id),
            })
            return

        if msg_type == "chat_message":
            message_data = content.get("data")
            if not isinstance(message_data, dict):
                await self.send_json({"type": "error", "message": "Invalid message data."})
                return
            await self.channel_layer.group_send(self.group_name, {
                "type": "broadcast_message",
                "data": message_data,
            })
            return

        await self.send_json({"type": "error", "message": "Invalid message type."})

    # ---- group event handlers (names match the "type" used in group_send) ----

    async def broadcast_message(self, event):
        await self.send_json({"type": "chat_message", "data": event["data"]})

    async def typing_event(self, event):
        if event["user_id"] == str(self.user.id):
            return  # don't echo to the sender
        await self.send_json({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "is_typing": True,
            "conversation_id": event["conversation_id"],
        })

    async def read_event(self, event):
        await self.send_json({
            "type": "read_receipt",
            "user_id": event["user_id"],
            "username": event["username"],
            "read_at": event["read_at"],
            "conversation_id": event["conversation_id"],
        })

    @database_sync_to_async
    def is_participant(self):
        return ConversationParticipantModel.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user,
            conversation__is_active=True,
        ).exists()
        
def send_user_notification(user_id, data):
    """
    Send a real-time notification to a specific user.
    Can be called from any Django view or service.
    """
    channel_layer = get_channel_layer()

    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{user_id}",
        {
            "type": "notification_message",
            "data": {
                **data,
                "recipient_id": str(user_id),
            },
        },
    )


def send_multiple_user_notifications(user_ids, data):
    """
    Send the same notification to multiple users.
    """
    for user_id in set(user_ids):
        send_user_notification(user_id, data)


class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"user_notifications_{self.user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": "Notification connection established.",
            "user_id": str(self.user.id),
        })

        logger.info(
            "Notification WebSocket connected for user %s",
            self.user.id,
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

        logger.info(
            "Notification WebSocket disconnected for user %s",
            getattr(self, "user", None),
        )

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type")

        if message_type == "ping":
            await self.send_json({
                "type": "pong",
            })
            return

        await self.send_json({
            "type": "error",
            "message": "Unsupported message type.",
        })

    async def notification_message(self, event):
        await self.send_json(event["data"])