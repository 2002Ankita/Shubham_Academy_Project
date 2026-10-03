from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class StudentBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    mobile_number: str
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str
    standard: str
    batch: str
    branch: str
    academic_year: str

class StudentCreate(StudentBase):
    password: str

class StudentResponse(StudentBase):
    id: str
    student_id: str
    rfid_tag: Optional[str] = None
    admission_date: datetime
