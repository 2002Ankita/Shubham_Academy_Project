from fastapi import APIRouter, Depends
from typing import List
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from app.services.attendance_service import mark_attendance, get_student_attendance
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("", response_model=AttendanceResponse)
async def create_attendance(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    return await mark_attendance(attendance_in)

@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
async def list_student_attendance(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_attendance(student_id)

@router.get("/teacher/{teacher_id}", response_model=List[AttendanceResponse])
async def list_teacher_attendance(teacher_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.attendance_service import get_teacher_attendance
    return await get_teacher_attendance(teacher_id)

@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    from app.services.attendance_service import check_in_teacher
    return await check_in_teacher(attendance_in)

@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    from app.services.attendance_service import check_out_teacher
    return await check_out_teacher(attendance_in)
