
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

# Import consumers only after Django initialization
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from real_time_connection.consumer import (
    LLMUpdateConsumer,
    ConversationConsumer,
    NotificationConsumer,
)
from backend.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
            URLRouter(
                [
                    path(
                        "ws/llm-api-update/<str:project_id>/",
                        LLMUpdateConsumer.as_asgi(),
                    ),
                    path(
                        "ws/conversations/<str:conversation_id>/",
                        ConversationConsumer.as_asgi(),
                    ),
                    path(
                        "ws/notification/",
                        NotificationConsumer.as_asgi(),
                    ),
                ]
            )
        ),
    }
)
