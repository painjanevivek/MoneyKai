from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.settings import get_settings
from backend.app.routers.backups import router as backups_router
from backend.app.routers.bootstrap import router as bootstrap_router
from backend.app.routers.challenges import router as challenges_router
from backend.app.routers.groups import router as groups_router
from backend.app.routers.health import router as health_router
from backend.app.routers.news import router as news_router
from backend.app.routers.resources import router as resources_router
from backend.app.routers.settings import router as settings_router

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(bootstrap_router)
app.include_router(resources_router)
app.include_router(news_router)
app.include_router(challenges_router)
app.include_router(groups_router)
app.include_router(settings_router)
app.include_router(backups_router)
