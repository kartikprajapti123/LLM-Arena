import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone

def decode_jwt(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}

def encode_jwt(email, expire_minutes=10):
    now = timezone.now()  # timezone-aware datetime
    payload = {
        "email": email,
        "exp": now + timedelta(minutes=expire_minutes),  # expiration
        "iat": now,  # issued at
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token
