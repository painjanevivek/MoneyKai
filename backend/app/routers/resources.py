from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.services.firestore_service import (
    delete_user_resource,
    ensure_user_profile,
    list_user_resources,
    upsert_user_resource,
)

ALLOWED_RESOURCES = {"transactions", "notes", "badges", "notifications"}

router = APIRouter(prefix="/v1/resources", tags=["resources"])


def _require_resource(resource: str) -> str:
    if resource not in ALLOWED_RESOURCES:
        raise HTTPException(status_code=404, detail="Unknown resource.")
    return resource


@router.get("/{resource}")
def list_resources(resource: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    _require_resource(resource)
    ensure_user_profile(user)
    return {"items": list_user_resources(user.uid, resource)}


@router.post("/{resource}")
def create_resource(resource: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    _require_resource(resource)
    ensure_user_profile(user)
    item = upsert_user_resource(user.uid, resource, payload)
    return {"item": item}


@router.get("/{resource}/{item_id}")
def get_resource_item(resource: str, item_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    _require_resource(resource)
    ensure_user_profile(user)
    items = list_user_resources(user.uid, resource)
    match = next((item for item in items if item.get("id") == item_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Item not found.")
    return {"item": match}


@router.put("/{resource}/{item_id}")
@router.patch("/{resource}/{item_id}")
def update_resource_item(resource: str, item_id: str, payload: dict, user: CurrentUser = Depends(get_current_user)) -> dict:
    _require_resource(resource)
    ensure_user_profile(user)
    item = upsert_user_resource(user.uid, resource, payload, item_id)
    return {"item": item}


@router.delete("/{resource}/{item_id}")
def delete_resource_item(resource: str, item_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    _require_resource(resource)
    ensure_user_profile(user)
    delete_user_resource(user.uid, resource, item_id)
    return {"deleted": True}

