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

@router.get("/{student_id}", response_model=List[AttendanceResponse])
async def list_student_attendance(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_attendance(student_id)
