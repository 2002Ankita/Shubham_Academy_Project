from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExamCreate(BaseModel):
    exam_name: str
    course: str
    batch: str
    subject: str
    exam_date: datetime
    start_time: datetime
    end_time: datetime
    max_marks: float
    passing_marks: float
    teacher_id: str

class ExamResponse(ExamCreate):
    id: str

class MarkCreate(BaseModel):
    student_id: str
    exam_id: str
    marks_obtained: float
    remarks: Optional[str] = ""

class MarkResponse(MarkCreate):
    id: str
    grade: str
    pass_status: bool
