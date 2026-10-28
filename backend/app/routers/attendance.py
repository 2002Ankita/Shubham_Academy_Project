from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.attendance import (
    AttendanceCreate, 
    AttendanceResponse,
    TeacherAttendanceRecord,
    TeacherAttendanceSummary,
    TeacherManualAttendanceCreate,
    AttendanceUpdate,
    BatchAttendanceLedgerResponse,
    BatchAttendanceLedgerSaveRequest
)
from app.services.attendance_service import (
    mark_attendance,
    get_student_attendance,
    get_teacher_attendance,
    check_in_teacher,
    check_out_teacher,
    get_all_teachers_attendance,
    get_teachers_attendance_summary,
    mark_manual_teacher_attendance,
    update_attendance_record,
    delete_attendance_record,
    get_all_attendance_logs,
    scan_rfid_card,
    get_batch_date_attendance,
    save_batch_date_attendance
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/ledger", response_model=BatchAttendanceLedgerResponse)
async def get_batch_attendance_ledger(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    branch: Optional[str] = Query(None, description="Branch (Tarabai Park or Mangalwar Peth)"),
    academic_batch: Optional[str] = Query(None, description="Academic batch (e.g. 11th PCM)"),
    session: Optional[str] = Query(None, description="Session (Morning/Afternoon) for Mangalwar Peth"),
    batch: Optional[str] = Query(None, description="Batch filter fallback"),
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch
    return await get_batch_date_attendance(
        date_str=date,
        branch=branch,
        academic_batch=academic_batch,
        session=session,
        batch=batch
    )

@router.post("/ledger")
async def save_batch_attendance_ledger(
    payload: BatchAttendanceLedgerSaveRequest,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = getattr(user, "role", "").upper().replace("-", "_")
    if role not in ["ADMIN", "SUPER_ADMIN", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to save attendance ledger")
    return await save_batch_date_attendance(payload.model_dump())


@router.get("/teachers", response_model=List[TeacherAttendanceRecord])
async def list_teachers_attendance(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    teacher_id: Optional[str] = Query(None, description="Filter by teacher ID"),
    status: Optional[str] = Query(None, description="Filter by status (Working, Present, Absent, etc.)"),
    start_date: Optional[str] = Query(None, description="Start date for range query"),
    end_date: Optional[str] = Query(None, description="End date for range query"),
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper()
    if role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to view teacher attendance records")
    return await get_all_teachers_attendance(date, teacher_id, status, start_date, end_date)

@router.get("/teachers/summary", response_model=TeacherAttendanceSummary)
async def get_teachers_summary(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper()
    if role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to view teacher attendance summary")
    return await get_teachers_attendance_summary(date)

@router.post("/teachers/manual")
async def manual_teacher_attendance(
    manual_in: TeacherManualAttendanceCreate,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper()
    if role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to record teacher attendance manually")
    return await mark_manual_teacher_attendance(manual_in.model_dump())

@router.get("/teacher/{teacher_id}", response_model=List[AttendanceResponse])
async def list_teacher_attendance(teacher_id: str, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    role = user.role.upper()
    if role == "TEACHER":
        teacher_id = str(user.id)
    elif role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to view teacher attendance")
    return await get_teacher_attendance(teacher_id)

@router.post("/check-in")
async def check_in(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper()
    if role == "TEACHER":
        attendance_in.teacher_id = str(user.id)
    elif role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to check in")
    return await check_in_teacher(attendance_in)

@router.post("/check-out")
async def check_out(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper()
    if role == "TEACHER":
        attendance_in.teacher_id = str(user.id)
    elif role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to check out")
    return await check_out_teacher(attendance_in)

@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
async def list_student_attendance(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_attendance(student_id)

@router.get("")
async def list_attendance(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_all_attendance_logs()

@router.post("/rfid-scan")
async def rfid_scan(payload: dict, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    rfid_card = payload.get("rfidCard")
    gate = payload.get("gate", "Gate 1")
    if not rfid_card:
        raise HTTPException(status_code=400, detail="RFID badge card UID is required")
    return await scan_rfid_card(rfid_card, gate)

@router.post("", response_model=AttendanceResponse)
async def create_attendance(
    attendance_in: AttendanceCreate, 
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    return await mark_attendance(attendance_in)

@router.put("/{attendance_id}")
async def update_attendance(
    attendance_id: str,
    update_in: AttendanceUpdate,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper().replace("-", "_")
    if role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to update attendance")
    return await update_attendance_record(attendance_id, update_in.model_dump(exclude_unset=True))

@router.delete("/{attendance_id}")
async def delete_attendance(
    attendance_id: str,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    role = user.role.upper().replace("-", "_")
    if role not in {"ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not authorized to delete attendance")
    return await delete_attendance_record(attendance_id)
