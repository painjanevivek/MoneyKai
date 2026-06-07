from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MoneyKai API"
    environment: str = "development"
    api_v1_prefix: str = "/v1"
    cors_origins: str = "http://localhost:8081,http://localhost:19006"
    firebase_project_id: str | None = None
    firebase_storage_bucket: str | None = None
    firebase_service_account_path: str | None = None
    firestore_root_collection: str = "users"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

