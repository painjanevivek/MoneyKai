from __future__ import annotations

import firebase_admin
from firebase_admin import credentials, firestore

from .settings import get_settings


def initialize_firebase_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return firebase_admin.get_app()

    settings = get_settings()
    credential_path = settings.firebase_service_account_path
    if not credential_path:
        credential_path = None

    if credential_path:
        cred = credentials.Certificate(credential_path)
    else:
        cred = credentials.ApplicationDefault()

    options: dict[str, str] = {}
    if settings.firebase_project_id:
        options["projectId"] = settings.firebase_project_id
    if settings.firebase_storage_bucket:
        options["storageBucket"] = settings.firebase_storage_bucket

    return firebase_admin.initialize_app(cred, options or None)


def get_firestore_client():
    initialize_firebase_app()
    return firestore.client()
