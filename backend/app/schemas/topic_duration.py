from pydantic import BaseModel
from typing import Optional, List

class TopicDurationBase(BaseModel):
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

class TopicDurationCreate(TopicDurationBase):
    pass

class TopicDurationUpdate(BaseModel):
    topic_id: Optional[str] = None
    standard: Optional[str] = None
    branch: Optional[str] = None
    batch: Optional[str] = None
    subject: Optional[str] = None
    teacher_name: Optional[str] = None
    chapter: Optional[str] = None
    topic_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    required_periods: Optional[int] = None
    period_duration_mins: Optional[int] = None
    completed_periods: Optional[int] = None
    status: Optional[str] = None
    academic_year: Optional[str] = None
    month: Optional[str] = None
    remarks: Optional[str] = None

class TopicDurationResponse(TopicDurationBase):
    id: str

class TopicDurationMatrixSummary(BaseModel):
    subject: str
    teacher_name: str
    batch: str
    total_topics: int
    total_planned_periods: int
    total_completed_periods: int
    completion_percentage: float
    completed_count: int
    in_progress_count: int
    upcoming_count: int
    topics: List[TopicDurationResponse]
