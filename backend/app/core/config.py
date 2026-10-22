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
    SECRET_KEY: str = "shubham_academy_super_secret_key_dev_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "academy_management"
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

try:
    settings = Settings()
except ValidationError as e:
    # Fallback to local development defaults rather than crashing startup
    print(
        "[WARNING] backend/.env missing or incomplete. Falling back to local development defaults. "
        "Create backend/.env from backend/.env.example to customize.",
        file=sys.stderr
    )
    settings = Settings(
        SECRET_KEY="shubham_academy_super_secret_key_dev_2026",
        MONGODB_URL="mongodb://localhost:27017",
        DATABASE_NAME="academy_management"
    )
