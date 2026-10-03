from beanie import Document, Indexed, Link
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr
from app.models.user import User

class Student(Document):
    user: Link[User]
    student_id: Annotated[str, Indexed(unique=True)]
    mobile_number: Annotated[str, Indexed(unique=True)]
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str
    standard: str = "12th Science"
    batch: str = "11th pcm tarabai park"
    branch: str = "Tarabai Park"
    academic_year: str
    rfid_tag: Optional[str] = None
    total_fees: float = 0.0
    admission_date: datetime = datetime.utcnow()

    class Settings:
        name = "students"
