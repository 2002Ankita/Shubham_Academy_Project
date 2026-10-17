from beanie import Document
from typing import Optional
from datetime import datetime

class TopicDuration(Document):
    topic_id: Optional[str] = None
    standard: str = "Class 12th"
    branch: Optional[str] = "Tarabai Park"
    batch: str
    subject: str
    teacher_name: str
    chapter: str
    topic_name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    required_periods: int = 1
    period_duration_mins: int = 45
    completed_periods: int = 0
    status: str = "Upcoming"
    academic_year: str = "2026-2027"
    month: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "topic_durations"
