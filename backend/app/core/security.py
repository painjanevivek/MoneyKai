from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from pydantic import BaseModel

from .firebase import initialize_firebase_app

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    uid: str
    email: str = ""
    full_name: str = ""
    avatar_url: str | None = None
    auth_provider: str = "email"


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Firebase bearer token.",
        )

    initialize_firebase_app()
    try:
        claims = firebase_auth.verify_id_token(credentials.credentials)
    except Exception as exc:  # pragma: no cover - firebase-admin raises several concrete exceptions
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token.",
        ) from exc

    return CurrentUser(
        uid=claims.get("uid") or claims.get("user_id") or claims.get("sub") or "",
        email=claims.get("email") or "",
        full_name=claims.get("name") or claims.get("display_name") or claims.get("email") or "User",
        avatar_url=claims.get("picture"),
        auth_provider="google" if claims.get("firebase", {}).get("sign_in_provider") == "google.com" else "email",
    )
