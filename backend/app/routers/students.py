from fastapi import APIRouter, Depends, HTTPException
from typing import List, Union
from app.schemas.student import StudentCreate, StudentAdminCreate, StudentResponse
from app.services.student_service import create_student, get_students, get_student_by_id, update_student, delete_student
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("", response_model=StudentResponse)
async def add_student(
    student_in: StudentAdminCreate, 
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper()
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can register new students")
    return await create_student(student_in)

@router.get("", response_model=List[StudentResponse])
async def list_students(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_students()

@router.get("/{id}", response_model=StudentResponse)
async def get_student_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    student = await get_student_by_id(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{id}", response_model=StudentResponse)
async def update_student_endpoint(id: str, student_in: dict, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    return await update_student(id, student_in, current_user=current_user)

@router.delete("/{id}")
async def delete_student_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper()
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can delete students")
    await delete_student(id)
    return {"message": "Student deleted successfully"}
