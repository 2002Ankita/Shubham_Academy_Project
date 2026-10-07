from pydantic import BaseModel
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class ExamCreate(BaseModel):
    exam_name: str
    standard: str
    batch: str
    branch: str
    subject: str
    exam_date: datetime
    start_time: datetime
    end_time: datetime
    max_marks: float
    passing_marks: float
    teacher_id: str

class ExamResponse(ExamCreate):
    id: str
    status: str = "Scheduled"

class MarkCreate(BaseModel):
    student_id: str
    exam_id: str
    marks_obtained: float
    remarks: Optional[str] = ""

class BulkMarkEntry(BaseModel):
    student_id: str
    marks_obtained: float = Field(ge=0, allow_inf_nan=False)
    remarks: str = ""

class BulkMarkCreate(BaseModel):
    exam_id: str
    entries: List[BulkMarkEntry] = Field(min_length=1)

class MarkResponse(MarkCreate):
    id: str
    grade: str
    pass_status: bool
    student_name: Optional[str] = ""
    roll_number: Optional[str] = ""
    exam_name: Optional[str] = ""
    subject: Optional[str] = ""
    max_marks: Optional[float] = 100
    exam_date: Optional[str] = ""
    teacher: Optional[str] = ""
