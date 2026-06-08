from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    delete_group_for_user,
    ensure_user_profile,
    list_group_expenses_for_user,
    list_groups_for_user,
    upsert_group,
    upsert_group_expense_for_user,
    user_group_expense_collection,
)

router = APIRouter(prefix="/v1/groups", tags=["groups"])


def _get_group(group_id: str, user_id: str, *, require_owner: bool = False) -> dict:
    snapshot = list_groups_for_user(user_id)
    data = next((group for group in snapshot if group.get("id") == group_id), None)
    if not data:
        raise HTTPException(status_code=404, detail="Group not found.")
    member_ids = data.get("member_ids") or []
    if user_id != data.get("created_by") and user_id not in member_ids:
        raise HTTPException(status_code=403, detail="You do not have access to this group.")
    if require_owner and user_id != data.get("created_by"):
        raise HTTPException(status_code=403, detail="Only the group owner can change this group.")
    return data


@router.get("")
def list_groups(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"items": list_groups_for_user(user.uid)}


@router.post("")
def create_group(payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    payload = {**payload, "created_by": user.uid}
    return {"item": upsert_group(user.uid, payload)}


@router.get("/{group_id}")
def get_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"item": _get_group(group_id, user.uid)}


@router.put("/{group_id}")
@router.patch("/{group_id}")
def update_group(group_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group(user.uid, {**current, **payload}, group_id)}


@router.delete("/{group_id}")
def remove_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    delete_group_for_user(user.uid, group_id)
    return {"deleted": True}


@router.post("/{group_id}/archive")
def archive_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    current["archived"] = True
    return {"item": upsert_group(user.uid, current, group_id)}


@router.post("/{group_id}/restore")
def restore_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    current["archived"] = False
    return {"item": upsert_group(user.uid, current, group_id)}


@router.get("/{group_id}/expenses")
def list_expenses(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid)
    return {"items": list_group_expenses_for_user(user.uid, group_id)}


@router.post("/{group_id}/expenses")
def create_expense(group_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group_expense_for_user(user.uid, group_id, payload)}


@router.put("/{group_id}/expenses/{expense_id}")
@router.patch("/{group_id}/expenses/{expense_id}")
def update_expense(group_id: str, expense_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group_expense_for_user(user.uid, group_id, payload, expense_id)}


@router.delete("/{group_id}/expenses/{expense_id}")
def delete_expense(group_id: str, expense_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    user_group_expense_collection(user.uid, group_id).document(expense_id).delete()
    return {"deleted": True}
