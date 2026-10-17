from beanie import Document
from typing import Optional
from datetime import datetime

class DailyActivity(Document):
    activity: str = "Classroom Lecture & Theory"
    subject: str
    batch: str
    branch: Optional[str] = "Tarabai Park"
    chapter: Optional[str] = None
    target_date: Optional[str] = None
    standard: Optional[str] = "Class 12th"
    topic_taught: str
    time_slot: Optional[str] = "08:30 AM - 10:00 AM"
    hours: float = 1.0
    periods: int = 1
    total_planned_periods: Optional[int] = 3
    status: str = "Completed"
    frequency: Optional[str] = "Daily"
    remarks: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_id: Optional[str] = None
    activity_date: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "daily_activities"
