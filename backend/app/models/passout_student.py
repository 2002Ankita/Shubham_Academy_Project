from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
import uuid


class PassoutStudent(Document):
    passout_id: str = Field(default_factory=lambda: f"PASS-{uuid.uuid4().hex[:8].upper()}")
    student_id: Optional[str] = None
    roll_number: Optional[str] = None
    student_name: str
    branch: str = "Tarabai Park"
    standard: Optional[str] = "12th Science"
    academic_batch: Optional[str] = None
    passing_year: str = "2025-2026"
    mobile_number: Optional[str] = None
    parent_mobile: Optional[str] = None

    # College Admission Record
    college_name: str
    college_city: Optional[str] = None
    course_or_degree: Optional[str] = None
    entrance_exam: Optional[str] = None
    entrance_score: Optional[str] = None
    remarks: Optional[str] = None

    # Attendance & Daily Logs Summary
    attendance_percentage: float = 0.0
    lectures_attended: int = 0
    total_lectures: int = 0
    daily_logs_count: int = 0
    daily_log_summary: Optional[str] = None

    recorded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "passout_students"
