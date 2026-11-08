from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from user.models import UserModel
from workspace.models import WorkspaceModel


def notify_workspace_owners_about_provider(provider):
    channel_layer = get_channel_layer()

    if channel_layer is None:
        return

    # Find all workspace owners
    owner_ids = (
        WorkspaceModel.objects
        .filter(owner__isnull=False)
        .values_list("owner_id", flat=True)
        .distinct()
    )

    message = {
        "type": "notification",
        "title": "New LLM Provider Available",
        "message": (
            f"{provider.name} has been added to LLM Arena. "
            "You can now use this provider for your comparisons."
        ),
        "notification_type": "llm_provider",
        "provider_id": str(provider.id),
    }

    for owner_id in owner_ids:
        async_to_sync(channel_layer.group_send)(
            f"user_notifications_{owner_id}",
            {
                "type": "notification_message",
                "data": {
                    **message,
                    "recipient_id": str(owner_id),
                },
            },
        )