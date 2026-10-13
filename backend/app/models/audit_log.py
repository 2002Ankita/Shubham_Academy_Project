from beanie import Document
from datetime import datetime
from typing import Optional

class NotificationAuditLog(Document):
    teacher_id: Optional[str] = ""
    teacher_name: Optional[str] = "Faculty"
    student_id: Optional[str] = ""
    student_name: Optional[str] = "Student"
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    masked_mobile: Optional[str] = None
    batch_name: Optional[str] = ""
    subject_name: Optional[str] = ""
    exam_id: Optional[str] = ""
    exam_name: Optional[str] = ""
    marks_obtained: Optional[float] = 0.0
    max_marks: Optional[float] = 100.0
    percentage: Optional[float] = 0.0
    channel: Optional[str] = "whatsapp"
    status: Optional[str] = "pending"
    details: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notification_audit_logs"
