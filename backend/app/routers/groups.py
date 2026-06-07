from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    delete_group,
    ensure_user_profile,
    list_group_expenses,
    list_groups_for_user,
    upsert_group,
    upsert_group_expense,
    db,
)

router = APIRouter(prefix="/v1/groups", tags=["groups"])


def _get_group(group_id: str, user_id: str, *, require_owner: bool = False) -> dict:
    snapshot = db().collection("groups").document(group_id).get()
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Group not found.")
    data = snapshot.to_dict() or {}
    data["id"] = snapshot.id
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
    return {"item": upsert_group(payload)}


@router.get("/{group_id}")
def get_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"item": _get_group(group_id, user.uid)}


@router.put("/{group_id}")
@router.patch("/{group_id}")
def update_group(group_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group({**current, **payload}, group_id)}


@router.delete("/{group_id}")
def remove_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    delete_group(group_id)
    return {"deleted": True}


@router.post("/{group_id}/archive")
def archive_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    current["archived"] = True
    return {"item": upsert_group(current, group_id)}


@router.post("/{group_id}/restore")
def restore_group(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    current = _get_group(group_id, user.uid, require_owner=True)
    current["archived"] = False
    return {"item": upsert_group(current, group_id)}


@router.get("/{group_id}/expenses")
def list_expenses(group_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid)
    return {"items": list_group_expenses(group_id)}


@router.post("/{group_id}/expenses")
def create_expense(group_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group_expense(group_id, payload)}


@router.put("/{group_id}/expenses/{expense_id}")
@router.patch("/{group_id}/expenses/{expense_id}")
def update_expense(group_id: str, expense_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    return {"item": upsert_group_expense(group_id, payload, expense_id)}


@router.delete("/{group_id}/expenses/{expense_id}")
def delete_expense(group_id: str, expense_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    _get_group(group_id, user.uid, require_owner=True)
    db().collection("groups").document(group_id).collection("expenses").document(expense_id).delete()
    return {"deleted": True}
