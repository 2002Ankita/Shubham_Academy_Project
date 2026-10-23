# pyrefly: ignore [missing-import]
from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.student import Student
from app.models.teacher import Teacher

class Attendance(Document):
    student: Optional[Link[Student]] = None
    teacher: Optional[Link[Teacher]] = None
    date: datetime
    status: str # Present, Absent, Late, Leave, Half Day, Holiday
    rfid_scan_time: Optional[datetime] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[str] = None
    remarks: Optional[str] = None
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    batch: Optional[str] = None
    lecture_slot: Optional[int] = None
    subject: Optional[str] = None

    class Settings:
        name = "attendance"
