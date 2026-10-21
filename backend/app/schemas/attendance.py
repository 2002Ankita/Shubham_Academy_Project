from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AttendanceCreate(BaseModel):
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    date: datetime
    status: str
    rfid_scan_time: Optional[datetime] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[str] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceCreate):
    id: str

class TeacherAttendanceRecord(BaseModel):
    id: str
    teacher_id: str
    teacher_name: str
    employee_id: str
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    subjects: Optional[List[str]] = []
    date: datetime
    status: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[str] = None
    remarks: Optional[str] = None

class TeacherAttendanceSummary(BaseModel):
    date: str
    total_teachers: int
    present_count: int
    working_count: int
    completed_count: int
    absent_count: int
    on_leave_count: int

class TeacherManualAttendanceCreate(BaseModel):
    teacher_id: str
    date: datetime
    status: str = "Present"
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[str] = None
    remarks: Optional[str] = None

class AttendanceUpdate(BaseModel):
    teacher_id: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[str] = None
    remarks: Optional[str] = None
