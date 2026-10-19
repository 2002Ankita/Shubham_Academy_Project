from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.teacher import TeacherCreate, TeacherResponse
from app.services.teacher_service import (
    create_teacher,
    get_teachers,
    get_teacher_for_user,
    get_teacher_by_id,
    update_teacher,
    delete_teacher
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.post("", response_model=TeacherResponse)
async def add_teacher(
    teacher_in: TeacherCreate,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can register new teachers")
    return await create_teacher(teacher_in)

@router.get("", response_model=List[TeacherResponse])
async def list_teachers(token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    
    if user_role in ["ADMIN", "SUPER_ADMIN"]:
        return await get_teachers()
    elif user_role == "TEACHER":
        teacher = await get_teacher_for_user(current_user)
        if teacher:
            return [teacher]
        return []
    else:
        # Non-administrative and non-teacher roles (e.g. STUDENT)
        return []

@router.get("/me", response_model=TeacherResponse)
async def get_current_teacher_profile(token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    teacher = await get_teacher_for_user(current_user)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return teacher

@router.get("/{id}", response_model=TeacherResponse)
async def get_teacher_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    
    if user_role == "TEACHER":
        my_teacher = await get_teacher_for_user(current_user)
        if not my_teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        if id not in [my_teacher["id"], my_teacher.get("employee_id"), str(current_user.id)]:
            raise HTTPException(status_code=403, detail="Not authorized to view other teacher details")
        return my_teacher

    teacher = await get_teacher_by_id(id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{id}", response_model=TeacherResponse)
async def update_teacher_endpoint(id: str, teacher_in: dict, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    
    if user_role == "TEACHER":
        my_teacher = await get_teacher_for_user(current_user)
        if not my_teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        if id not in [my_teacher["id"], my_teacher.get("employee_id"), str(current_user.id)]:
            raise HTTPException(status_code=403, detail="Not authorized to update other teacher details")

    try:
        return await update_teacher(id, teacher_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{id}")
async def delete_teacher_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can delete teachers")
    try:
        await delete_teacher(id)
        return {"message": "Teacher deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
