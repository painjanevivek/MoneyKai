from fastapi.testclient import TestClient

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.main import app
from backend.app.routers import settings as settings_router


def test_delete_account_endpoint_calls_delete_user_account(monkeypatch):
    called: dict[str, str] = {}

    def fake_delete_user_account(user_id: str) -> None:
        called["user_id"] = user_id

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        uid="user-123",
        email="user@example.com",
        full_name="Money User",
    )
    monkeypatch.setattr(settings_router, "delete_user_account", fake_delete_user_account)

    try:
        client = TestClient(app)
        response = client.delete("/v1/settings/account")

        assert response.status_code == 200
        assert response.json() == {"deleted": True}
        assert called["user_id"] == "user-123"
    finally:
        app.dependency_overrides.clear()
