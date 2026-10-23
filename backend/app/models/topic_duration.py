from beanie import Document
from typing import Optional
from datetime import datetime

class TopicDuration(Document):
    topic_id: Optional[str] = None
    standard: Optional[str] = "Class 12th"
    branch: Optional[str] = "Tarabai Park"
    batch: Optional[str] = "12th Science Tarabai Park (Batch A)"
    subject: Optional[str] = "Physics"
    teacher_name: Optional[str] = "Senior Faculty"
    chapter: Optional[str] = "Curriculum Chapter"
    topic_name: Optional[str] = "Topic Plan"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_date: Optional[str] = None
    required_periods: Optional[int] = 1
    period_duration_mins: Optional[int] = 45
    completed_periods: Optional[int] = 0
    status: Optional[str] = "In Progress"
    academic_year: Optional[str] = "2026-2027"
    month: Optional[str] = None
    remarks: Optional[str] = None
    sr_no: Optional[int] = None
    title: Optional[str] = None
    boards_lectures: Optional[int] = 0
    entrance_lectures: Optional[int] = 0
    total_lectures: Optional[int] = 0
    branch_scope: Optional[str] = "mp/tp"
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()


    class Settings:
        name = "topic_durations"
