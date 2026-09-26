from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AttendanceCreate(BaseModel):
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    date: datetime
    status: str
    rfid_scan_time: Optional[datetime] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceCreate):
    id: str
