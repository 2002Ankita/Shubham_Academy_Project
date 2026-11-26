"""
Accounts Router for Shubham Academy
Provides endpoints for:
- Accounts ID & Password authentication (Tarabai Park, Mangalvar Peth, Super Admin)
- Combined monthly fees counter and faculty payroll summary
- Accounts security status
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.routers.auth import oauth2_scheme
from app.services.auth_service import get_current_user
from app.models.user import User
from app.core.accounts_config import (
    verify_accounts_credentials,
    get_accounts_credentials_info,
    BRANCH_ACCOUNTS_CONFIG,
    SUPER_ADMIN_ACCOUNTS
)
from app.core.branch_config import normalize_branch, BRANCH_TARABAI, BRANCH_MANGALWAR

router = APIRouter(prefix="/accounts", tags=["Accounts"])

class AccountsVerifyRequest(BaseModel):
    accounts_id: str
    password: str
    branch: Optional[str] = None

class AccountsVerifyResponse(BaseModel):
    success: bool
    branch: str
    role: str
    accounts_id: str
    message: str
    unlocked_at: Optional[str] = None

@router.post("/verify")
async def verify_accounts_endpoint(
    req: AccountsVerifyRequest
):
    """
    Verifies Accounts ID & Password for Tarabai Park or Mangalvar Peth,
    or Superadmin Master credentials.
    """
    res = await verify_accounts_credentials(req.accounts_id, req.password, req.branch)
    if not res.get("success"):
        raise HTTPException(status_code=401, detail=res.get("message", "Invalid Accounts ID or Password."))
    
    from datetime import datetime
    return {
        "success": True,
        "branch": res.get("branch"),
        "role": res.get("role"),
        "accounts_id": res.get("accounts_id"),
        "message": res.get("message"),
        "unlocked_at": datetime.utcnow().isoformat()
    }

@router.get("/info")
async def get_accounts_info_endpoint(
    branch: Optional[str] = Query(None)
):
    """
    Returns public accounts info/branch details for the given campus.
    """
    return get_accounts_credentials_info(branch)

@router.get("/summary")
async def get_accounts_summary_endpoint(
    branch: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme)
):
    """
    Returns combined monthly fees counter and faculty salary summary for the Accounts dashboard.
    """
    current_user = await get_current_user(token)
    norm_branch = normalize_branch(branch or current_user.branch)
    
    from datetime import datetime
    target_month = month or datetime.utcnow().strftime("%B %Y")
    
    # 1. Calculate Fees Counter
    from app.models.student import Student
    from app.models.admission import AdmissionRecord
    
    student_query = {}
    if norm_branch and norm_branch.lower() not in ["all", "super", "both"]:
        student_query["branch"] = norm_branch
        
    students = await Student.find(student_query).to_list() if hasattr(Student, 'find') else []
    
    total_expected_fees = 0.0
    total_collected_fees = 0.0
    total_pending_dues = 0.0
    overdue_students_count = 0
    
    for s in students:
        tot = float(getattr(s, 'total_fees', 0.0) or 0.0)
        paid = float(getattr(s, 'paid_fees', 0.0) or 0.0)
        rem = float(getattr(s, 'remaining_fees', max(0.0, tot - paid)) or 0.0)
        
        total_expected_fees += tot
        total_collected_fees += paid
        total_pending_dues += rem
        if rem > 0:
            overdue_students_count += 1
            
    # 2. Calculate Teacher Salaries for the month
    from app.models.salary import SalaryPayment
    from app.services.salary_service import ensure_current_month_salaries
    
    try:
        await ensure_current_month_salaries(target_month)
    except Exception as e:
        print("Accounts summary salary ensure error:", e)
        
    salaries = await SalaryPayment.find(SalaryPayment.month_name == target_month).to_list()
    
    total_salary_liability = 0.0
    total_salary_disbursed = 0.0
    total_salary_pending = 0.0
    teachers_count = len(salaries)
    disbursed_count = 0
    
    for sal in salaries:
        # If branch filtering is requested, filter by teacher branch
        net = float(getattr(sal, 'net_payable', 0.0) or getattr(sal, 'base_salary', 0.0) or 0.0)
        paid = float(getattr(sal, 'amount_paid', 0.0) or 0.0)
        pend = float(getattr(sal, 'amount_pending', max(0.0, net - paid)) or 0.0)
        
        total_salary_liability += net
        total_salary_disbursed += paid
        total_salary_pending += pend
        if getattr(sal, 'status', '') == 'Disbursed' or pend == 0:
            disbursed_count += 1

    return {
        "branch": norm_branch or "All Campuses",
        "month": target_month,
        "fees_counter": {
            "total_expected": total_expected_fees,
            "total_collected": total_collected_fees,
            "total_pending": total_pending_dues,
            "overdue_students_count": overdue_students_count,
            "collection_rate_percent": round((total_collected_fees / max(1.0, total_expected_fees)) * 100, 1)
        },
        "salary_counter": {
            "total_liability": total_salary_liability,
            "total_disbursed": total_salary_disbursed,
            "total_pending": total_salary_pending,
            "faculty_count": teachers_count,
            "disbursed_count": disbursed_count,
            "disbursement_rate_percent": round((total_salary_disbursed / max(1.0, total_salary_liability)) * 100, 1) if total_salary_liability > 0 else 0.0
        },
        "accounts_credentials_info": get_accounts_credentials_info(norm_branch)
    }
