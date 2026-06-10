from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.settings import get_settings
from .routers.backups import router as backups_router
from .routers.bootstrap import router as bootstrap_router
from .routers.challenges import router as challenges_router
from .routers.diagnostics import router as diagnostics_router
from .routers.groups import router as groups_router
from .routers.health import router as health_router
from .routers.news import router as news_router
from .routers.resources import router as resources_router
from .routers.settings import router as settings_router

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
app.include_router(diagnostics_router)
app.include_router(resources_router)
app.include_router(news_router)
app.include_router(challenges_router)
app.include_router(groups_router)
app.include_router(settings_router)
app.include_router(backups_router)
