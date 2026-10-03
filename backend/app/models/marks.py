from beanie import Document, Link
from datetime import datetime
from app.models.teacher import Teacher
from app.models.student import Student

class Exam(Document):
    exam_name: str
    standard: str = "12th Science"
    batch: str = "11th pcm tarabai park"
    branch: str = "Tarabai Park"
    subject: str
    exam_date: datetime
    start_time: datetime
    end_time: datetime
    max_marks: float
    passing_marks: float
    teacher: Link[Teacher]
    status: str = "Scheduled"
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "exams"

class Mark(Document):
    student: Link[Student]
    exam: Link[Exam]
    marks_obtained: float
    remarks: str = ""
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "marks"
