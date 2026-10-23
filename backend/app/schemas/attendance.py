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
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    batch: Optional[str] = None
    lecture_slot: Optional[int] = None
    subject: Optional[str] = None

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

class StudentLectureSlotInfo(BaseModel):
    slot: int = 1
    subject: Optional[str] = "Physics"
    time: Optional[str] = None
    status: str = "Not Marked"
    attendance_id: Optional[str] = None
    notification_sent: bool = False

class StudentLedgerRecord(BaseModel):
    id: str
    student_id: str
    roll_number: str
    student_name: str
    batch: str
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    parent_mobile: Optional[str] = None
    lecture_1: StudentLectureSlotInfo
    lecture_2: StudentLectureSlotInfo

class LectureSummary(BaseModel):
    present: int = 0
    absent: int = 0
    rate: int = 0

class BatchAttendanceLedgerResponse(BaseModel):
    date: str
    formatted_date: str
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    total_enrolled: int = 0
    lecture_1_summary: LectureSummary
    lecture_2_summary: LectureSummary
    records: List[StudentLedgerRecord]

class BatchStudentAttendanceSaveItem(BaseModel):
    student_id: str
    lecture_1_status: Optional[str] = "Present"
    lecture_1_subject: Optional[str] = "Physics"
    lecture_2_status: Optional[str] = "Present"
    lecture_2_subject: Optional[str] = "Mathematics"
    remarks: Optional[str] = None

class BatchAttendanceLedgerSaveRequest(BaseModel):
    date: str
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    records: List[BatchStudentAttendanceSaveItem]

