from beanie import Document, Indexed, Link
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr
from app.models.user import User

class Student(Document):
    user: Link[User]
    student_id: Annotated[str, Indexed(unique=True)]
    mobile_number: str
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str
    course: str
    batch: str
    academic_year: str
    rfid_tag: Optional[str] = None
    admission_date: datetime = datetime.utcnow()

    class Settings:
        name = "students"
