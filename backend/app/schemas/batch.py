from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BatchCreate(BaseModel):
    name: str
    standard: str
    subject: str
    room: Optional[str] = "Room 201"
    time: Optional[str] = "09:00 AM – 10:00 AM"
    date: Optional[str] = None
    student_count: int = 0
    teacher_name: Optional[str] = None
    teacher_id: Optional[str] = None
    batch_name: Optional[str] = None
    class_code: Optional[str] = None
    days: Optional[List[str]] = None
    timetable: Optional[List[Dict[str, Any]]] = None
    academic_year: Optional[str] = "2025-2026"
    branch: Optional[str] = "Tarabai Park"
    status: Optional[str] = "Active"

class BatchResponse(BatchCreate):
    id: str
