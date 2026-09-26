from beanie import Document, Indexed
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr

class User(Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    role: str # SUPER_ADMIN, ADMIN, TEACHER, STUDENT
    full_name: str
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
