from beanie import Document, Link
from datetime import datetime
from typing import Optional, List
from app.models.user import User

class Notice(Document):
    title: str
    content: str
    target_audiences: list[str] # e.g., ["STUDENT", "TEACHER", "ALL", "SUPER_ADMIN", "ADMIN"]
    target_batches: list[str] = [] # empty means all batches
    category: str = "General"
    priority: str = "Normal"
    branch: Optional[str] = None # e.g. "Mangalvar Peth", "Tarabai Park", "ALL"
    batch: Optional[str] = None  # e.g. "11th pcm Mangalvar peth", "12th pcb tarabai park"
    standard: Optional[str] = None # e.g. "11th Science", "12th Science"
    created_by: Optional[Link[User]] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notices"
