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
    remarks: Optional[str] = None

    class Settings:
        name = "attendance"
