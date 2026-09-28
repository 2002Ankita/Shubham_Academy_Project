from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate
from app.models.student import Student
from app.models.teacher import Teacher
from fastapi import HTTPException
from beanie import PydanticObjectId

async def mark_attendance(attendance_in: AttendanceCreate) -> Attendance:
    from app.services.student_service import resolve_student
    from app.services.teacher_service import resolve_teacher
    student = None
    teacher = None
    if attendance_in.student_id:
        student = await resolve_student(str(attendance_in.student_id))
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
        
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
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await Attendance.find(Attendance.student.id == student.id).to_list()

async def check_in_teacher(attendance_in: AttendanceCreate) -> Attendance:
    from app.services.teacher_service import resolve_teacher
    from datetime import datetime
    teacher = None
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check if already checked in today
    today = attendance_in.date.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = attendance_in.date.replace(hour=23, minute=59, second=59)
    existing = await Attendance.find(
        Attendance.teacher.id == teacher.id,
        Attendance.date >= today,
        Attendance.date <= tomorrow
    ).first_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")

    attendance = Attendance(
        teacher=teacher,
        date=attendance_in.date,
        status="Working" if attendance_in.status == "Present" else attendance_in.status,
        check_in_time=datetime.utcnow(),
        remarks=attendance_in.remarks
    )
    await attendance.insert()
    return attendance

async def check_out_teacher(attendance_in: AttendanceCreate) -> Attendance:
    from app.services.teacher_service import resolve_teacher
    from datetime import datetime
    teacher = None
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    today = attendance_in.date.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = attendance_in.date.replace(hour=23, minute=59, second=59)
    existing = await Attendance.find(
        Attendance.teacher.id == teacher.id,
        Attendance.date >= today,
        Attendance.date <= tomorrow
    ).first_or_none()

    if not existing:
        raise HTTPException(status_code=400, detail="Not checked in today")
        
    if existing.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out")

    existing.check_out_time = datetime.utcnow()
    await existing.save()
    return existing

async def get_teacher_attendance(teacher_id: str) -> list[dict]:
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(teacher_id)
    if not teacher:
        return []
    records = await Attendance.find(Attendance.teacher.id == teacher.id).to_list()
    res = []
    for r in records:
        d = dict(r)
        d["id"] = str(r.id)
        d["teacher_id"] = str(teacher.id)
        d["student_id"] = ""
        res.append(d)
    return res
