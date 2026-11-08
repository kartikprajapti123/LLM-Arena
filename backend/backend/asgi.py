import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import path
from real_time_connection.consumer import LLMUpdateConsumer, ConversationConsumer,NotificationConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django_asgi_app = get_asgi_application()
from backend.middleware import JWTAuthMiddleware
# from chat.consumers import AdminChatConsumer, PublicChatConsumer

application = ProtocolTypeRouter(
    {
        # Django's ASGI application to handle traditional HTTP requests
        "http": django_asgi_app,
        # WebSocket chat handler
        "websocket": JWTAuthMiddleware(
        URLRouter([
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
                    ])
    ),
    }
)
