import sys
from pathlib import Path
from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shubham Academy Management System"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Database
    MONGODB_URL: str
    DATABASE_NAME: str
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

try:
    settings = Settings()
except ValidationError as e:
    # Instead of traceback, give a clear developer-friendly error
    missing_vars = [err['loc'][0] for err in e.errors() if err['type'] == 'missing']
    if missing_vars:
        raise ValueError(
            "Missing required environment variables. "
            "Please create backend/.env from backend/.env.example and configure "
            "SECRET_KEY, MONGODB_URL and DATABASE_NAME."
        ) from None
    else:
        raise
