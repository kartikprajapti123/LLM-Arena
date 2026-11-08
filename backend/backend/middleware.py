
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_user_from_token(token):
    jwt_auth = JWTAuthentication()

    validated_token = jwt_auth.get_validated_token(
        token.encode("utf-8")
    )

    return jwt_auth.get_user(validated_token)


class JWTAuthMiddleware:

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        scope["user"] = AnonymousUser()

        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if token:
            try:
                scope["user"] = await get_user_from_token(token)
            except Exception as exc:
                # Debug only; never print the actual token.
                print("WebSocket JWT error:", type(exc).__name__)

        return await self.inner(scope, receive, send)
