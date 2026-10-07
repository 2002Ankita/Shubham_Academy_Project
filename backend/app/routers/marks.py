from fastapi import APIRouter, Depends
from typing import List
from app.schemas.marks import BulkMarkCreate, MarkCreate, MarkResponse
from app.services.mark_service import enter_bulk_marks, enter_marks, get_student_results
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/marks", tags=["Marks"])

@router.post("", response_model=MarkResponse)
async def add_marks(mark_in: MarkCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await enter_marks(mark_in)

@router.post("/bulk", response_model=List[MarkResponse])
async def add_bulk_marks(marks_in: BulkMarkCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await enter_bulk_marks(marks_in)

@router.get("", response_model=List[MarkResponse])
async def list_all_marks(token: str = Depends(oauth2_scheme)):
    from app.services.mark_service import get_all_marks
    await get_current_user(token)
    return await get_all_marks()

@router.get("/{student_id}", response_model=List[MarkResponse])
async def list_student_marks(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_results(student_id)
