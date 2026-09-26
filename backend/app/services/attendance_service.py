from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate
from app.models.student import Student
from app.models.teacher import Teacher
from fastapi import HTTPException
from beanie import PydanticObjectId

async def mark_attendance(attendance_in: AttendanceCreate) -> Attendance:
    student = None
    teacher = None
    if attendance_in.student_id:
        student = await Student.get(attendance_in.student_id)
    if attendance_in.teacher_id:
        teacher = await Teacher.get(attendance_in.teacher_id)
        
    attendance = Attendance(
        student=student,
        teacher=teacher,
        date=attendance_in.date,
        status=attendance_in.status,
        rfid_scan_time=attendance_in.rfid_scan_time,
        remarks=attendance_in.remarks
    )
    await attendance.insert()
    return attendance

async def get_student_attendance(student_id: str) -> list[Attendance]:
    student = await Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await Attendance.find(Attendance.student.id == student.id).to_list()
