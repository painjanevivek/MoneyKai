from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    delete_user_resource,
    ensure_user_profile,
    list_user_resources,
    upsert_user_resource,
)

router = APIRouter(prefix="/v1/challenges", tags=["challenges"])


def _get_challenge(user_id: str, challenge_id: str) -> dict:
    item = next((challenge for challenge in list_user_resources(user_id, "challenges") if challenge.get("id") == challenge_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return item


@router.get("")
def list_challenges(user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"items": list_user_resources(user.uid, "challenges")}


@router.post("")
def create_challenge(payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    data = {**payload, "status": payload.get("status", "active")}
    return {"item": upsert_user_resource(user.uid, "challenges", data)}


@router.get("/{challenge_id}")
def get_challenge(challenge_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"item": _get_challenge(user.uid, challenge_id)}


@router.put("/{challenge_id}")
@router.patch("/{challenge_id}")
def update_challenge(challenge_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    return {"item": upsert_user_resource(user.uid, "challenges", payload, challenge_id)}


@router.post("/{challenge_id}/deactivate")
def deactivate_challenge(challenge_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    challenge = _get_challenge(user.uid, challenge_id)
    challenge["status"] = "deactivated"
    return {"item": upsert_user_resource(user.uid, "challenges", challenge, challenge_id)}


@router.post("/{challenge_id}/reactivate")
def reactivate_challenge(challenge_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    challenge = _get_challenge(user.uid, challenge_id)
    challenge["status"] = "active"
    return {"item": upsert_user_resource(user.uid, "challenges", challenge, challenge_id)}


@router.post("/{challenge_id}/complete")
def complete_challenge(challenge_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    challenge = _get_challenge(user.uid, challenge_id)
    challenge["status"] = "completed"
    challenge["xp_earned"] = payload.get("xp_earned", challenge.get("xp_earned", 0))
    challenge["savings_earned"] = payload.get("savings_earned", challenge.get("savings_earned", 0))
    return {"item": upsert_user_resource(user.uid, "challenges", challenge, challenge_id)}


@router.delete("/{challenge_id}")
def delete_challenge(challenge_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_user_profile(user)
    delete_user_resource(user.uid, "challenges", challenge_id)
    return {"deleted": True}

