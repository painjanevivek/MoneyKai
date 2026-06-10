from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from ..core.security import CurrentUser, get_current_user
from ..services.firestore_service import create_user_diagnostic_event, ensure_user_profile

DiagnosticSeverity = Literal["info", "warning", "error", "fatal"]

MAX_METADATA_DEPTH = 3
MAX_STRING_LENGTH = 500
MAX_STACK_LENGTH = 2000

SENSITIVE_METADATA_KEYS = {
    "body",
    "content",
    "notificationbody",
    "notificationtitle",
    "rawbody",
    "rawbodystored",
    "rawpayload",
    "sender",
    "smsbody",
    "smstext",
    "text",
    "title",
}

router = APIRouter(prefix="/v1/diagnostics", tags=["diagnostics"])


class DiagnosticEventPayload(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    createdAt: str = Field(min_length=1, max_length=80)
    scope: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=MAX_STRING_LENGTH)
    severity: DiagnosticSeverity
    platform: str = Field(min_length=1, max_length=80)
    appVersion: str | None = Field(default=None, max_length=80)
    errorName: str | None = Field(default=None, max_length=120)
    errorMessage: str | None = Field(default=None, max_length=MAX_STRING_LENGTH)
    errorStack: str | None = Field(default=None, max_length=MAX_STACK_LENGTH)
    metadata: dict[str, Any] | None = None

    @field_validator("metadata")
    @classmethod
    def sanitize_metadata(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        return sanitize_metadata(value)


def normalize_key(key: str) -> str:
    return "".join(character for character in key.lower() if character.isalnum())


def truncate(value: str, max_length: int = MAX_STRING_LENGTH) -> str:
    return value if len(value) <= max_length else f"{value[:max_length]}..."


def sanitize_value(value: Any, depth: int = 0) -> Any:
    if depth > MAX_METADATA_DEPTH:
        return "[Max depth]"
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return truncate(value)
    if isinstance(value, list):
        return [sanitize_value(item, depth + 1) for item in value[:20]]
    if isinstance(value, dict):
        return sanitize_metadata(value, depth + 1)
    return truncate(str(value))


def sanitize_metadata(metadata: dict[str, Any] | None, depth: int = 0) -> dict[str, Any] | None:
    if not metadata:
        return None

    sanitized: dict[str, Any] = {}
    for key, value in list(metadata.items())[:50]:
        sanitized[key[:80]] = "[Redacted]" if normalize_key(key) in SENSITIVE_METADATA_KEYS else sanitize_value(value, depth)
    return sanitized


@router.post("/events", status_code=202)
def create_diagnostic_event(
    payload: DiagnosticEventPayload,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    ensure_user_profile(user)
    item = create_user_diagnostic_event(user.uid, payload.model_dump(exclude_none=True))
    return {"accepted": True, "id": item["id"]}
