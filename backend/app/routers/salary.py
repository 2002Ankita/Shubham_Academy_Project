from fastapi import APIRouter, Depends
from typing import List
from app.schemas.salary import SalaryPaymentResponse
from app.services.salary_service import get_salary_details
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/salary", tags=["Salary"])

@router.get("/{teacher_id}", response_model=List[SalaryPaymentResponse])
async def salary_details(teacher_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_salary_details(teacher_id)
