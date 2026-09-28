from fastapi import APIRouter, Depends
from typing import List
from app.schemas.salary import SalaryPaymentResponse, SalaryUpdateRequest
from app.services.salary_service import get_all_salaries, update_salary, disburse_salary, generate_monthly_salaries
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/salary", tags=["Salary"])

@router.get("", response_model=List[SalaryPaymentResponse])
async def list_salaries(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_all_salaries()

@router.put("/{id}", response_model=SalaryPaymentResponse)
async def update_salary_endpoint(id: str, req: SalaryUpdateRequest, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await update_salary(id, req.baseSalary, req.allowances, req.deductions, req.netPayable)

@router.post("/disburse/{id}", response_model=SalaryPaymentResponse)
async def disburse_salary_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await disburse_salary(id)

@router.post("/generate/{month}")
async def generate_salaries_endpoint(month: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    await generate_monthly_salaries(month)
    return {"message": f"Drafts generated for {month}"}
