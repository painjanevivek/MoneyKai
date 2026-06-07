from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    build_bootstrap_snapshot,
    ensure_user_profile,
    get_latest_backup,
    restore_snapshot_for_user,
    save_backup,
)

router = APIRouter(prefix="/v1/backups", tags=["backups"])


@router.get("")
def list_backups(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    snapshot = build_bootstrap_snapshot(user)
    return {"items": snapshot["data"].get("backups", [])}


@router.get("/latest")
def latest_backup(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    backup = get_latest_backup(user.uid)
    if not backup:
        raise HTTPException(status_code=404, detail="No backup exists yet.")
    return {"item": backup}


@router.post("")
def create_backup(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    snapshot = build_bootstrap_snapshot(user)
    backup = save_backup(user, snapshot)
    return {"item": backup}


@router.post("/restore-latest")
def restore_latest(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    backup = get_latest_backup(user.uid)
    if not backup or "snapshot" not in backup:
        raise HTTPException(status_code=404, detail="No backup exists yet.")
    restore_snapshot_for_user(user.uid, backup["snapshot"])
    return {"item": backup["snapshot"]}


@router.post("/restore")
def restore_from_payload(payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    snapshot = payload.get("snapshot")
    if not snapshot:
        raise HTTPException(status_code=400, detail="Missing snapshot.")
    restore_snapshot_for_user(user.uid, snapshot)
    return {"item": snapshot}

