from beanie import Document
from typing import Optional
from datetime import datetime

class DailyActivity(Document):
    activity: Optional[str] = "Classroom Lecture & Theory"
    subject: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    chapter: Optional[str] = None
    target_date: Optional[str] = None
    standard: Optional[str] = None
    topic_taught: Optional[str] = None
    time_slot: Optional[str] = None
    hours: float = 1.0
    periods: int = 1
    total_planned_periods: Optional[int] = None
    status: Optional[str] = "Completed"
    frequency: Optional[str] = "Daily"
    remarks: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_id: Optional[str] = None
    activity_date: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "daily_activities"
