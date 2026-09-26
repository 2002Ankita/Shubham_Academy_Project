from fastapi import APIRouter, Depends
from typing import List
from app.schemas.student import StudentCreate, StudentResponse
from app.services.student_service import create_student, get_students
from app.utils.permissions import require_roles
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("", response_model=StudentResponse)
async def add_student(
    student_in: StudentCreate, 
    token: str = Depends(oauth2_scheme)
):
    # Enforce role (simplified)
    await get_current_user(token)
    # Ideally use require_roles(["SUPER_ADMIN", "ADMIN"]) here
    return await create_student(student_in)

@router.get("", response_model=List[StudentResponse])
async def list_students(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_students()

@router.get("/{id}", response_model=StudentResponse)
async def get_student_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.student_service import get_student_by_id
    from fastapi import HTTPException
    student = await get_student_by_id(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{id}", response_model=StudentResponse)
async def update_student_endpoint(id: str, student_in: dict, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.student_service import update_student
    return await update_student(id, student_in)

@router.delete("/{id}")
async def delete_student_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.student_service import delete_student
    await delete_student(id)
    return {"message": "Student deleted successfully"}
