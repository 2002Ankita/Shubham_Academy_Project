from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class StudentCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    mobile_number: str
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str
    course: str
    batch: str
    academic_year: str

class StudentResponse(StudentCreate):
    id: str
    student_id: str
    rfid_tag: Optional[str] = None
    admission_date: datetime
