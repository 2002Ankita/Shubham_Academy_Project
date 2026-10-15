from pydantic import BaseModel
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class ExamCreate(BaseModel):
    exam_name: str
    exam_type: Optional[str] = "Regular"
    standard: str
    section: Optional[str] = ""
    batch: Optional[str] = "General"
    branch: Optional[str] = "Tarabai Park"
    subject: str
    exam_date: datetime
    start_time: datetime
    end_time: datetime
    duration: Optional[str] = "2 Hours"
    room_no: Optional[str] = "Room 101"
    max_marks: float = 100.0
    passing_marks: Optional[float] = 35.0
    teacher_id: Optional[str] = ""

class ExamResponse(ExamCreate):
    id: str
    status: str = "Scheduled"
    teacher_name: Optional[str] = ""

class MarkCreate(BaseModel):
    student_id: str
    exam_id: str
    marks_obtained: float
    remarks: Optional[str] = ""
    status: Optional[str] = "Published"

class BulkMarkEntry(BaseModel):
    student_id: str
    marks_obtained: float = Field(ge=0, allow_inf_nan=False)
    remarks: str = ""
    status: Optional[str] = "Published"

class BulkMarkCreate(BaseModel):
    exam_id: str
    entries: List[BulkMarkEntry] = Field(min_length=1)
    status: Optional[str] = "Published"

class MarkResponse(MarkCreate):
    id: str
    grade: str
    pass_status: bool
    status: Optional[str] = "Published"
    student_name: Optional[str] = ""
    roll_number: Optional[str] = ""
    exam_name: Optional[str] = ""
    subject: Optional[str] = ""
    max_marks: Optional[float] = 100
    exam_date: Optional[str] = ""
    teacher: Optional[str] = ""

class SendMarksNotificationRequest(BaseModel):
    exam_id: str
    batch: Optional[str] = ""
    subject: Optional[str] = ""
    channel: str = Field(..., pattern=r"^(whatsapp|sms)$")
    student_ids: Optional[List[str]] = None

class StudentNotificationResult(BaseModel):
    student_id: str
    student_name: str
    parent_name: Optional[str] = ""
    parent_mobile: Optional[str] = ""
    masked_mobile: str
    marks_obtained: float
    max_marks: float
    percentage: float
    status: str  # "sent", "failed", "unconfigured", "missing_phone"
    message: str

class SendMarksNotificationResponse(BaseModel):
    summary: dict
    channel: str
    results: List[StudentNotificationResult]
    teacher_notification: Optional[dict] = None

