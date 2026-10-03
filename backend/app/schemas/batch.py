from pydantic import BaseModel
from typing import Optional

class BatchCreate(BaseModel):
    name: str
    standard: str
    subject: str
    room: Optional[str] = None
    time: Optional[str] = None
    student_count: int = 0
    teacher_name: Optional[str] = None

class BatchResponse(BatchCreate):
    id: str
