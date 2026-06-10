from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from firebase_admin import auth as firebase_auth

from backend.app.core.firebase import get_firestore_client
from backend.app.core.security import CurrentUser

USER_RESOURCE_SORT_KEYS: dict[str, str] = {
    "transactions": "transaction_date",
    "notes": "updated_at",
    "savings": "created_at",
    "badges": "id",
    "notifications": "created_at",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def to_jsonable(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    return value


def normalize_document(doc) -> dict[str, Any]:
    data = doc.to_dict() or {}
    normalized = to_jsonable(data)
    if isinstance(normalized, dict):
        normalized.setdefault("id", doc.id)
    return normalized


def db():
    return get_firestore_client()


def _delete_documents(document_refs: Iterable[Any]) -> None:
    batch = db().batch()
    operations = 0
    for document_ref in document_refs:
        batch.delete(document_ref)
        operations += 1
        if operations >= 450:
            batch.commit()
            batch = db().batch()
            operations = 0

    if operations > 0:
        batch.commit()


def _delete_collection_documents(collection_ref) -> None:
    _delete_documents(doc.reference for doc in collection_ref.stream())


def user_doc(user_id: str):
    return db().collection("users").document(user_id)


def user_resource_collection(user_id: str, resource: str):
    return user_doc(user_id).collection(resource)


def user_group_collection(user_id: str):
    return user_doc(user_id).collection("groups")


def user_group_doc(user_id: str, group_id: str):
    return user_group_collection(user_id).document(group_id)


def user_group_expense_collection(user_id: str, group_id: str):
    return user_group_doc(user_id, group_id).collection("expenses")


def ensure_user_profile(user: CurrentUser) -> dict[str, Any]:
    profile = {
        "id": user.uid,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "auth_provider": user.auth_provider,
        "updated_at": now_iso(),
        "created_at": now_iso(),
    }
    ref = user_doc(user.uid)
    existing = ref.get()
    if existing.exists:
        ref.set({**profile, "created_at": normalize_document(existing).get("created_at", profile["created_at"])}, merge=True)
    else:
        ref.set(profile, merge=True)
    return profile


def list_user_resources(user_id: str, resource: str) -> list[dict[str, Any]]:
    sort_key = USER_RESOURCE_SORT_KEYS.get(resource, "created_at")
    docs = [normalize_document(doc) for doc in user_resource_collection(user_id, resource).stream()]
    docs.sort(key=lambda item: str(item.get(sort_key, "")), reverse=True)
    return docs


def upsert_user_resource(user_id: str, resource: str, payload: dict[str, Any], item_id: str | None = None) -> dict[str, Any]:
    doc_id = item_id or str(payload.get("id") or uuid4().hex)
    ref = user_resource_collection(user_id, resource).document(doc_id)
    existing_snapshot = ref.get()
    existing = normalize_document(existing_snapshot) if existing_snapshot.exists else {}

    data = {
        **existing,
        **payload,
        "id": doc_id,
        "user_id": user_id,
        "updated_at": now_iso(),
    }
    if "created_at" not in existing:
        data["created_at"] = payload.get("created_at") or now_iso()
    if resource == "transactions" and "transaction_date" not in data:
        data["transaction_date"] = payload.get("transaction_date") or now_iso()[:10]
    ref.set(data, merge=True)
    return to_jsonable(data)


def delete_user_resource(user_id: str, resource: str, item_id: str) -> None:
    user_resource_collection(user_id, resource).document(item_id).delete()


def create_user_diagnostic_event(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    doc_id = str(payload.get("id") or uuid4().hex)
    ref = user_doc(user_id).collection("diagnostics").document(doc_id)
    data = {
        **payload,
        "id": doc_id,
        "user_id": user_id,
        "received_at": now_iso(),
    }
    ref.set(data, merge=False)
    return to_jsonable(data)


def replace_user_resource(user_id: str, resource: str, items: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    collection_ref = user_resource_collection(user_id, resource)
    batch = db().batch()
    for doc in collection_ref.stream():
        batch.delete(doc.reference)
    batch.commit()
    return [upsert_user_resource(user_id, resource, item, str(item.get("id") or uuid4().hex)) for item in items]


def get_app_settings(user_id: str) -> dict[str, Any]:
    ref = user_doc(user_id).collection("settings").document("app")
    snapshot = ref.get()
    return normalize_document(snapshot) if snapshot.exists else {
        "theme": "light",
        "currency": "INR",
        "currencySymbol": "₹",
        "notificationsEnabled": True,
        "hapticEnabled": True,
        "tourCompleted": False,
    }


def set_app_settings(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    ref = user_doc(user_id).collection("settings").document("app")
    data = {**get_app_settings(user_id), **payload, "updated_at": now_iso()}
    ref.set(data, merge=True)
    return to_jsonable(data)


def get_budget_settings(user_id: str) -> dict[str, Any]:
    ref = user_doc(user_id).collection("budgets").document("current")
    snapshot = ref.get()
    if snapshot.exists:
        return normalize_document(snapshot)
    return {
        "settings": {
            "monthly_allowance": 0,
            "reset_day": 1,
            "auto_reset": True,
            "carry_forward": False,
            "currency": "INR",
        },
        "adjustments": [],
        "isEmergencyMode": False,
        "resetHistory": [],
    }


def set_budget_settings(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    ref = user_doc(user_id).collection("budgets").document("current")
    data = {**get_budget_settings(user_id), **payload, "updated_at": now_iso()}
    ref.set(data, merge=True)
    return to_jsonable(data)


def list_groups_for_user(user_id: str) -> list[dict[str, Any]]:
    groups = [normalize_document(doc) for doc in user_group_collection(user_id).stream()]
    groups.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    return groups


def upsert_group(user_id: str, payload: dict[str, Any], item_id: str | None = None) -> dict[str, Any]:
    group_id = item_id or str(payload.get("id") or uuid4().hex)
    ref = user_group_doc(user_id, group_id)
    existing_snapshot = ref.get()
    existing = normalize_document(existing_snapshot) if existing_snapshot.exists else {}
    member_ids = payload.get("member_ids") or existing.get("member_ids") or [user_id]
    created_by = existing.get("created_by") or payload.get("created_by") or user_id
    data = {
        **existing,
        **payload,
        "id": group_id,
        "created_by": created_by,
        "member_ids": member_ids,
        "updated_at": now_iso(),
    }
    if "created_at" not in existing:
        data["created_at"] = payload.get("created_at") or now_iso()
    ref.set(data, merge=True)
    return to_jsonable(data)


def delete_group_for_user(user_id: str, group_id: str) -> None:
    group_ref = user_group_doc(user_id, group_id)
    expenses_ref = user_group_expense_collection(user_id, group_id)
    batch = db().batch()
    for expense in expenses_ref.stream():
        batch.delete(expense.reference)
    batch.delete(group_ref)
    batch.commit()


def delete_user_account(user_id: str) -> None:
    group_ids = [group["id"] for group in list_groups_for_user(user_id)]

    for group_id in group_ids:
        _delete_collection_documents(user_group_expense_collection(user_id, group_id))

    _delete_collection_documents(user_doc(user_id).collection("transactions"))
    _delete_collection_documents(user_doc(user_id).collection("notes"))
    _delete_collection_documents(user_doc(user_id).collection("savings"))
    _delete_collection_documents(user_doc(user_id).collection("badges"))
    _delete_collection_documents(user_doc(user_id).collection("notifications"))
    _delete_collection_documents(user_doc(user_id).collection("backups"))
    _delete_collection_documents(user_doc(user_id).collection("settings"))
    _delete_collection_documents(user_doc(user_id).collection("budgets"))
    _delete_collection_documents(user_group_collection(user_id))
    user_doc(user_id).delete()

    try:
        firebase_auth.delete_user(user_id)
    except firebase_auth.UserNotFoundError:
        pass


def list_group_expenses_for_user(user_id: str, group_id: str) -> list[dict[str, Any]]:
    expenses = [normalize_document(doc) for doc in user_group_expense_collection(user_id, group_id).stream()]
    expenses.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    return expenses


def upsert_group_expense_for_user(user_id: str, group_id: str, payload: dict[str, Any], item_id: str | None = None) -> dict[str, Any]:
    expense_id = item_id or str(payload.get("id") or uuid4().hex)
    ref = user_group_expense_collection(user_id, group_id).document(expense_id)
    existing_snapshot = ref.get()
    existing = normalize_document(existing_snapshot) if existing_snapshot.exists else {}
    data = {
        **existing,
        **payload,
        "id": expense_id,
        "group_id": group_id,
        "updated_at": now_iso(),
    }
    if "created_at" not in existing:
        data["created_at"] = payload.get("created_at") or now_iso()
    ref.set(data, merge=True)
    return to_jsonable(data)


def list_backups(user_id: str) -> list[dict[str, Any]]:
    backups = [normalize_document(doc) for doc in user_doc(user_id).collection("backups").stream()]
    backups.sort(key=lambda item: str(item.get("createdAtMs", "")), reverse=True)
    return backups


def save_backup(user: CurrentUser, snapshot: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "backup_name": f"Backup {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        "snapshot": snapshot,
        "createdAt": now_iso(),
        "createdAtMs": int(datetime.now(timezone.utc).timestamp() * 1000),
    }
    ref = user_doc(user.uid).collection("backups").document()
    ref.set(payload)
    return to_jsonable(payload)


def get_latest_backup(user_id: str) -> dict[str, Any] | None:
    docs = list_backups(user_id)
    return docs[0] if docs else None


def restore_snapshot_for_user(user_id: str, snapshot: dict[str, Any]) -> None:
    replace_user_resource(user_id, "transactions", snapshot.get("data", {}).get("transactions", []))
    replace_user_resource(user_id, "notes", snapshot.get("data", {}).get("notes", []))
    replace_user_resource(user_id, "savings", snapshot.get("data", {}).get("savings", snapshot.get("data", {}).get("challenges", [])))
    replace_user_resource(user_id, "badges", snapshot.get("data", {}).get("badges", []))
    replace_user_resource(user_id, "notifications", snapshot.get("data", {}).get("notifications", []))
    set_app_settings(user_id, snapshot.get("settings", {}).get("app", {}))
    set_budget_settings(user_id, snapshot.get("settings", {}).get("budget", {}))

    existing_groups = list_groups_for_user(user_id)
    for group in existing_groups:
        delete_group_for_user(user_id, group["id"])
    for group in snapshot.get("data", {}).get("groups", []):
        upsert_group(user_id, group, group.get("id"))
    for group_expense in snapshot.get("data", {}).get("groupExpenses", []):
        group_id = group_expense.get("group_id", "")
        upsert_group_expense_for_user(user_id, group_id, group_expense, group_expense.get("id"))


def build_bootstrap_snapshot(user: CurrentUser) -> dict[str, Any]:
    profile = ensure_user_profile(user)
    transactions = list_user_resources(user.uid, "transactions")
    notes = list_user_resources(user.uid, "notes")
    savings = list_user_resources(user.uid, "savings")
    badges = list_user_resources(user.uid, "badges")
    notifications = list_user_resources(user.uid, "notifications")
    groups = list_groups_for_user(user.uid)
    group_expenses: list[dict[str, Any]] = []
    for group in groups:
        group_expenses.extend(list_group_expenses_for_user(user.uid, group["id"]))

    app_settings = get_app_settings(user.uid)
    budget_settings = get_budget_settings(user.uid)
    backups = list_backups(user.uid)

    total_spent = sum(item.get("amount", 0) for item in transactions if item.get("type") == "expense")
    total_income = sum(item.get("amount", 0) for item in transactions if item.get("type") == "income")
    total_xp = sum(item.get("xp_earned", 0) for item in savings)

    return {
        "version": 1,
        "capturedAt": now_iso(),
        "profile": profile,
        "settings": {
            "app": app_settings,
            "budget": budget_settings,
        },
        "data": {
            "transactions": transactions,
            "notes": notes,
            "groups": groups,
            "groupExpenses": group_expenses,
            "challenges": savings,
            "savings": savings,
            "totalXP": total_xp,
            "badges": badges,
            "notifications": notifications,
            "backups": backups,
        },
        "summary": {
            "totalSpent": total_spent,
            "totalIncome": total_income,
            "transactionCount": len(transactions),
            "challengeCount": len(savings),
            "groupCount": len(groups),
        },
    }


