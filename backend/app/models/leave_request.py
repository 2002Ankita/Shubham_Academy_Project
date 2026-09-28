from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.teacher import Teacher

class LeaveRequest(Document):
    teacher: Link[Teacher]
    teacher_name: str
    leave_type: str
    from_date: datetime
    to_date: datetime
    number_of_days: int
    reason: Optional[str] = None
    status: str = "Pending"
    created_at: datetime = datetime.utcnow()
    admin_comment: Optional[str] = None

    class Settings:
        name = "leave_requests"
