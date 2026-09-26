from fastapi import APIRouter, Depends
from typing import List
from app.schemas.teacher import TeacherCreate, TeacherResponse
from app.services.teacher_service import create_teacher, get_teachers
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.post("", response_model=TeacherResponse)
async def add_teacher(
    teacher_in: TeacherCreate,
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    return await create_teacher(teacher_in)

@router.get("", response_model=List[TeacherResponse])
async def list_teachers(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_teachers()

@router.get("/{id}", response_model=TeacherResponse)
async def get_teacher_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.teacher_service import get_teacher_by_id
    from fastapi import HTTPException
    teacher = await get_teacher_by_id(id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{id}", response_model=TeacherResponse)
async def update_teacher_endpoint(id: str, teacher_in: dict, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.teacher_service import update_teacher
    from fastapi import HTTPException
    try:
        return await update_teacher(id, teacher_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{id}")
async def delete_teacher_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.teacher_service import delete_teacher
    from fastapi import HTTPException
    try:
        await delete_teacher(id)
        return {"message": "Teacher deactivated successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
