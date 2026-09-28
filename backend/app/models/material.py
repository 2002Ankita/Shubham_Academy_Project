# pyrefly: ignore [missing-import]
from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.teacher import Teacher

class Material(Document):
    title: str
    standard: str
    subject: str
    file_type: str
    size: str
    description: Optional[str] = None
    file_path: str
    teacher: Optional[Link[Teacher]] = None
    teacher_name: Optional[str] = None
    upload_date: datetime = datetime.utcnow()

    class Settings:
        name = "materials"
