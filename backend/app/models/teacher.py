from beanie import Document, Indexed, Link
from typing import Optional, List, Annotated
from datetime import datetime
from app.models.user import User

class Teacher(Document):
    user: Link[User]
    employee_id: Annotated[str, Indexed(unique=True)]
    mobile_number: str
    subjects: List[str]
    assigned_batches: List[str]
    joining_date: datetime = datetime.utcnow()
    hourly_rate: float = 0.0
    status: str = "Active"

    class Settings:
        name = "teachers"
