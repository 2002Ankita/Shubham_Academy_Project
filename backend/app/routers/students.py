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
    current_user = await get_current_user(token)
    return await create_student(student_in, current_user)

@router.get("/discounts/approvals")
async def list_discount_approvals(status: str = None, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.student_service import get_discount_approvals
    return await get_discount_approvals(status)

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

@router.post("/{id}/offer-discount", response_model=StudentResponse)
async def offer_discount_endpoint(id: str, payload: dict, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    from app.services.student_service import offer_student_discount
    return await offer_student_discount(id, payload, current_user)

@router.post("/{id}/approve-discount", response_model=StudentResponse)
async def approve_discount_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    from app.services.student_service import approve_student_discount
    return await approve_student_discount(id, current_user)

@router.post("/{id}/reject-discount", response_model=StudentResponse)
async def reject_discount_endpoint(id: str, payload: dict = None, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    reason = (payload or {}).get("reason", "Rejected by Superadmin")
    from app.services.student_service import reject_student_discount
    return await reject_student_discount(id, reason, current_user)
