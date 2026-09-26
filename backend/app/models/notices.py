from beanie import Document, Link
from datetime import datetime
from app.models.user import User

class Notice(Document):
    title: str
    content: str
    target_audiences: list[str] # e.g., ["STUDENT", "TEACHER", "ALL"]
    target_batches: list[str] = [] # empty means all batches
    created_by: Link[User]
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notices"
