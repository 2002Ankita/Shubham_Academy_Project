from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BatchCreate(BaseModel):
    name: str
    standard: str
    subject: str
    room: Optional[str] = None
    time: Optional[str] = None
    date: Optional[str] = None
    student_count: int = 0
    teacher_name: Optional[str] = None
    batch_name: Optional[str] = None
    class_code: Optional[str] = None
    days: Optional[List[str]] = None
    timetable: Optional[List[Dict[str, Any]]] = None

class BatchResponse(BatchCreate):
    id: str
