from fastapi import APIRouter, Depends

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import build_bootstrap_snapshot

router = APIRouter(prefix="/v1", tags=["bootstrap"])


@router.get("/bootstrap")
def get_bootstrap(user: CurrentUser = Depends(get_current_user)) -> dict:
    return build_bootstrap_snapshot(user)

