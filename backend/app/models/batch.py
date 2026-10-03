from beanie import Document
from typing import Optional

class Batch(Document):
    name: str
    standard: str
    subject: str
    room: Optional[str] = None
    time: Optional[str] = None
    student_count: int = 0
    teacher_name: Optional[str] = None

    class Settings:
        name = "batches"
