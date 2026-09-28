from fastapi import APIRouter, Depends
from typing import List
from app.schemas.marks import ExamCreate, ExamResponse
from app.services.mark_service import create_exam, get_all_exams
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("", response_model=ExamResponse)
async def add_exam(exam_in: ExamCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_exam(exam_in)

@router.get("", response_model=List[ExamResponse])
async def list_exams(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_all_exams()

@router.delete("/{id}")
async def delete_exam_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.mark_service import delete_exam
    from fastapi import HTTPException
    try:
        await delete_exam(id)
        return {"message": "Exam deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{id}", response_model=ExamResponse)
async def update_exam_endpoint(id: str, exam_in: dict, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.mark_service import update_exam
    from fastapi import HTTPException
    try:
        return await update_exam(id, exam_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
