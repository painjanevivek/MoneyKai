from fastapi.testclient import TestClient

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.main import app
from backend.app.routers import diagnostics as diagnostics_router


def test_diagnostics_endpoint_requires_auth():
    client = TestClient(app)
    response = client.post(
        "/v1/diagnostics/events",
        json={
            "id": "event-1",
            "createdAt": "2026-06-11T00:00:00Z",
            "scope": "nativeCapture.status",
            "message": "Native capture failed",
            "severity": "error",
            "platform": "android",
        },
    )

    assert response.status_code == 401


def test_diagnostics_endpoint_redacts_sensitive_metadata(monkeypatch):
    stored: dict = {}

    def fake_create_user_diagnostic_event(user_id: str, payload: dict) -> dict:
        stored["user_id"] = user_id
        stored["payload"] = payload
        return {"id": payload["id"]}

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        uid="user-123",
        email="user@example.com",
        full_name="Money User",
    )
    monkeypatch.setattr(diagnostics_router, "ensure_user_profile", lambda user: None)
    monkeypatch.setattr(diagnostics_router, "create_user_diagnostic_event", fake_create_user_diagnostic_event)

    try:
        client = TestClient(app)
        response = client.post(
            "/v1/diagnostics/events",
            json={
                "id": "event-1",
                "createdAt": "2026-06-11T00:00:00Z",
                "scope": "nativeCapture.signalHandler",
                "message": "Native signal handler failed",
                "severity": "error",
                "platform": "android",
                "metadata": {
                    "source": "sms",
                    "sender": "HDFCBK",
                    "body": "Rs 100 debited at Merchant",
                    "rawPayload": {"body": "nested raw body"},
                    "status": "error",
                },
            },
        )

        assert response.status_code == 202
        assert response.json() == {"accepted": True, "id": "event-1"}
        assert stored["user_id"] == "user-123"
        assert stored["payload"]["metadata"] == {
            "source": "sms",
            "sender": "[Redacted]",
            "body": "[Redacted]",
            "rawPayload": "[Redacted]",
            "status": "error",
        }
    finally:
        app.dependency_overrides.clear()
