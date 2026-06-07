from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.app.services.news_service import NewsServiceError, get_live_news

router = APIRouter(prefix="/v1/news", tags=["news"])


@router.get("")
async def list_news(
    category: str = Query("all"),
    limit: int = Query(15, ge=1, le=20),
    refresh: bool = Query(False),
) -> dict:
    try:
        return await get_live_news(category=category, limit=limit, refresh=refresh)
    except NewsServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
