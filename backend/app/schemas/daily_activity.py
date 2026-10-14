from pydantic import BaseModel
from typing import Optional

class DailyActivityBase(BaseModel):
    activity: str = "Classroom Lecture & Theory"
    subject: str
    batch: str
    standard: Optional[str] = "Class 12th"
    topic_taught: str
    time_slot: Optional[str] = "08:30 AM - 10:00 AM"
    hours: float = 1.0
    periods: int = 1
    total_planned_periods: Optional[int] = 3
    status: str = "Completed"
    remarks: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_id: Optional[str] = None
    activity_date: Optional[str] = None

class DailyActivityCreate(DailyActivityBase):
    pass

class DailyActivityUpdate(BaseModel):
    activity: Optional[str] = None
    subject: Optional[str] = None
    batch: Optional[str] = None
    standard: Optional[str] = None
    topic_taught: Optional[str] = None
    time_slot: Optional[str] = None
    hours: Optional[float] = None
    periods: Optional[int] = None
    total_planned_periods: Optional[int] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_id: Optional[str] = None
    activity_date: Optional[str] = None

class DailyActivityResponse(DailyActivityBase):
    id: str
