from fastapi import APIRouter, Depends

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    delete_user_account,
    ensure_user_profile,
    get_app_settings,
    get_budget_settings,
    set_app_settings,
    set_budget_settings,
)

router = APIRouter(prefix="/v1/settings", tags=["settings"])


@router.get("")
def read_settings(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {
        "app": get_app_settings(user.uid),
        "budget": get_budget_settings(user.uid),
    }


@router.put("/app")
def update_app_settings(payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"app": set_app_settings(user.uid, payload)}


@router.put("/budget")
def update_budget_settings(payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"budget": set_budget_settings(user.uid, payload)}


@router.delete("/account")
def delete_account(user: CurrentUser = Depends(get_current_user)) -> dict:
    delete_user_account(user.uid)
    return {"deleted": True}
