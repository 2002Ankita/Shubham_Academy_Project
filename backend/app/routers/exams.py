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
