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
    academic_year: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme)
):
    """
    Returns combined monthly and yearly fees counter and faculty salary summary
    for the Accounts dashboard, including full calendar month breakdown.
    """
    current_user = await get_current_user(token)
    norm_branch = normalize_branch(branch or current_user.branch)
    
    from datetime import datetime
    now = datetime.utcnow()
    current_month_name = now.strftime("%B %Y")
    target_month = month or current_month_name
    curr_academic_year = academic_year or "2026-2027"

    # Define academic months (April 2026 through March 2027)
    academic_months = [
        "April 2026", "May 2026", "June 2026", "July 2026", "August 2026",
        "September 2026", "October 2026", "November 2026", "December 2026",
        "January 2027", "February 2027", "March 2027"
    ]
    if target_month not in academic_months and target_month.upper() not in ["ALL", "FULL YEAR"]:
        academic_months.append(target_month)

    # 1. Load Students for Fees Calculations
    from app.models.student import Student
    from app.models.fees import FeePayment
    
    student_query = {}
    if norm_branch and norm_branch.lower() not in ["all", "super", "both", "all campuses"]:
        student_query["branch"] = norm_branch
        
    students = await Student.find(student_query).to_list() if hasattr(Student, 'find') else []
    student_id_branch_map = {str(s.id): getattr(s, "branch", norm_branch) for s in students}
    
    yearly_expected_fees = 0.0
    yearly_collected_fees = 0.0
    yearly_pending_dues = 0.0
    overdue_students_count = 0
    
    for s in students:
        tot = float(getattr(s, 'total_fees', 0.0) or 0.0)
        paid = float(getattr(s, 'paid_fees', 0.0) or 0.0)
        rem = float(getattr(s, 'remaining_fees', max(0.0, tot - paid)) or 0.0)
        
        yearly_expected_fees += tot
        yearly_collected_fees += paid
        yearly_pending_dues += rem
        if rem > 0:
            overdue_students_count += 1
            
    # Load all fee payments for this branch
    all_payments = await FeePayment.find_all().to_list() if hasattr(FeePayment, 'find_all') else []
    branch_payments = []
    for p in all_payments:
        p_br = getattr(p, "branch", None)
        if not p_br and getattr(p, "student", None):
            s_id = str(getattr(p.student, "id", "") or getattr(getattr(p.student, "ref", None), "id", ""))
            p_br = student_id_branch_map.get(s_id)
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or (p_br and normalize_branch(p_br) == norm_branch):
            branch_payments.append(p)

    # 2. Monthly Fee Calculations
    is_all_months = target_month.upper() in ["ALL", "FULL YEAR", "YEARLY"]
    
    month_start_dt = None
    month_end_dt = None
    if not is_all_months:
        try:
            m_dt = datetime.strptime(target_month, "%B %Y")
            month_start_dt = datetime(m_dt.year, m_dt.month, 1)
            if m_dt.month == 12:
                month_end_dt = datetime(m_dt.year + 1, 1, 1)
            else:
                month_end_dt = datetime(m_dt.year, m_dt.month + 1, 1)
        except Exception:
            month_start_dt = None
            month_end_dt = None

    selected_month_payments = []
    if is_all_months:
        selected_month_payments = branch_payments
    elif month_start_dt and month_end_dt:
        for p in branch_payments:
            p_date = getattr(p, "payment_date", None)
            if p_date and month_start_dt <= p_date < month_end_dt:
                selected_month_payments.append(p)

    monthly_collected_fees = sum(float(getattr(p, "amount_paid", 0.0) or 0.0) for p in selected_month_payments)
    
    # Monthly expected calculation:
    # If viewing All Months: equal to yearly
    # If viewing a specific month: installment share of yearly expected (1/10th per academic month) or actual collections
    if is_all_months:
        monthly_expected_fees = yearly_expected_fees
        monthly_pending_fees = yearly_pending_dues
    else:
        # Standard monthly billing cycle allocation:
        monthly_expected_fees = round(yearly_expected_fees / 10.0, 2) if yearly_expected_fees > 0 else 0.0
        # If monthly collected exceeds the 1/10th average, adapt target to collected
        if monthly_collected_fees > monthly_expected_fees:
            monthly_expected_fees = monthly_collected_fees
        monthly_pending_fees = max(0.0, round(monthly_expected_fees - monthly_collected_fees, 2))

    # 3. Teacher Salary Calculations
    from app.models.teacher import Teacher
    from app.models.salary import SalaryPayment
    from app.services.salary_service import ensure_current_month_salaries
    
    teacher_query = {}
    if norm_branch and norm_branch.lower() not in ["all", "super", "both", "all campuses"]:
        teacher_query["branch"] = norm_branch
    teachers = await Teacher.find(teacher_query).to_list() if hasattr(Teacher, 'find') else []
    teacher_id_set = {str(t.id) for t in teachers}
    total_faculty_count = len(teachers)

    # Ensure salary records for the selected month (if specific month)
    if not is_all_months:
        try:
            await ensure_current_month_salaries(target_month)
        except Exception as e:
            print("Accounts summary salary ensure error:", e)

    all_salaries = await SalaryPayment.find_all().to_list() if hasattr(SalaryPayment, 'find_all') else []
    branch_salaries = []
    for sal in all_salaries:
        t_id = str(getattr(sal.teacher, "id", "") or getattr(getattr(sal.teacher, "ref", None), "id", ""))
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or t_id in teacher_id_set:
            branch_salaries.append(sal)

    # Yearly Salary Totals across all academic months
    yearly_salary_liability = 0.0
    yearly_salary_disbursed = 0.0
    yearly_salary_pending = 0.0
    yearly_disbursements_count = 0

    for sal in branch_salaries:
        net = float(getattr(sal, 'net_payable', 0.0) or getattr(sal, 'base_salary', 0.0) or 0.0)
        paid = float(getattr(sal, 'amount_paid', 0.0) or 0.0)
        pend = float(getattr(sal, 'amount_pending', max(0.0, net - paid)) or 0.0)
        yearly_salary_liability += net
        yearly_salary_disbursed += paid
        yearly_salary_pending += pend
        if getattr(sal, 'status', '') == 'Disbursed' or (paid > 0 and pend == 0):
            yearly_disbursements_count += 1

    # Monthly Salary Totals for target_month
    if is_all_months:
        month_salaries = branch_salaries
        monthly_salary_liability = yearly_salary_liability
        monthly_salary_disbursed = yearly_salary_disbursed
        monthly_salary_pending = yearly_salary_pending
        monthly_disbursed_count = yearly_disbursements_count
        monthly_faculty_count = total_faculty_count
    else:
        month_salaries = [s for s in branch_salaries if s.month_name == target_month]
        monthly_salary_liability = 0.0
        monthly_salary_disbursed = 0.0
        monthly_salary_pending = 0.0
        monthly_disbursed_count = 0
        monthly_faculty_count = len(month_salaries) or total_faculty_count

        for sal in month_salaries:
            net = float(getattr(sal, 'net_payable', 0.0) or getattr(sal, 'base_salary', 0.0) or 0.0)
            paid = float(getattr(sal, 'amount_paid', 0.0) or 0.0)
            pend = float(getattr(sal, 'amount_pending', max(0.0, net - paid)) or 0.0)
            monthly_salary_liability += net
            monthly_salary_disbursed += paid
            monthly_salary_pending += pend
            if getattr(sal, 'status', '') == 'Disbursed' or (paid > 0 and pend == 0):
                monthly_disbursed_count += 1

    # 4. Generate Calendar Month Breakdown for UI calendar & quick selector
    monthly_calendar_stats = []
    for am in academic_months:
        # Check payments in am
        try:
            am_dt = datetime.strptime(am, "%B %Y")
            am_start = datetime(am_dt.year, am_dt.month, 1)
            am_end = datetime(am_dt.year + 1, 1, 1) if am_dt.month == 12 else datetime(am_dt.year, am_dt.month + 1, 1)
        except Exception:
            am_start, am_end = None, None

        am_collected = 0.0
        if am_start and am_end:
            for p in branch_payments:
                p_date = getattr(p, "payment_date", None)
                if p_date and am_start <= p_date < am_end:
                    am_collected += float(getattr(p, "amount_paid", 0.0) or 0.0)

        # Check salaries in am
        am_salaries = [s for s in branch_salaries if s.month_name == am]
        am_salary_disbursed = sum(float(getattr(s, "amount_paid", 0.0) or 0.0) for s in am_salaries)
        am_salary_liability = sum(float(getattr(s, "net_payable", 0.0) or getattr(s, "base_salary", 0.0) or 0.0) for s in am_salaries)

        monthly_calendar_stats.append({
            "month_name": am,
            "short_name": am.replace(" 2026", " '26").replace(" 2027", " '27"),
            "fees_collected": am_collected,
            "salary_liability": am_salary_liability,
            "salary_disbursed": am_salary_disbursed,
            "is_current": (am == current_month_name),
            "is_selected": (am == target_month),
            "faculty_count": len(am_salaries) or total_faculty_count
        })

    # Backward-compatible fee & salary counter representations
    # (Matches what the current UI KPI cards consume)
    fees_counter = {
        "total_expected": yearly_expected_fees,
        "total_collected": yearly_collected_fees,
        "total_pending": yearly_pending_dues,
        "overdue_students_count": overdue_students_count,
        "collection_rate_percent": round((yearly_collected_fees / max(1.0, yearly_expected_fees)) * 100, 1),
        "total_students": len(students)
    }

    salary_counter = {
        "total_liability": monthly_salary_liability if not is_all_months else yearly_salary_liability,
        "total_disbursed": monthly_salary_disbursed if not is_all_months else yearly_salary_disbursed,
        "total_pending": monthly_salary_pending if not is_all_months else yearly_salary_pending,
        "faculty_count": monthly_faculty_count,
        "disbursed_count": monthly_disbursed_count,
        "disbursement_rate_percent": round((monthly_salary_disbursed / max(1.0, monthly_salary_liability)) * 100, 1) if monthly_salary_liability > 0 else 0.0
    }

    return {
        "branch": norm_branch or "All Campuses",
        "month": target_month,
        "academic_year": curr_academic_year,
        "is_all_months": is_all_months,
        "available_months": academic_months,
        "monthly_calendar_stats": monthly_calendar_stats,
        
        # Explicit Monthly Data
        "monthly_fees": {
            "month": target_month,
            "total_collected": monthly_collected_fees,
            "total_expected": monthly_expected_fees,
            "total_pending": monthly_pending_fees,
            "payments_count": len(selected_month_payments),
            "collection_rate_percent": round((monthly_collected_fees / max(1.0, monthly_expected_fees)) * 100, 1) if monthly_expected_fees > 0 else 0.0
        },
        
        # Explicit Yearly Data
        "yearly_fees": {
            "academic_year": curr_academic_year,
            "total_collected": yearly_collected_fees,
            "total_expected": yearly_expected_fees,
            "total_pending": yearly_pending_dues,
            "total_students": len(students),
            "overdue_students_count": overdue_students_count,
            "collection_rate_percent": round((yearly_collected_fees / max(1.0, yearly_expected_fees)) * 100, 1) if yearly_expected_fees > 0 else 0.0
        },
        
        # Explicit Monthly Salary
        "monthly_salary": {
            "month": target_month,
            "total_liability": monthly_salary_liability,
            "total_disbursed": monthly_salary_disbursed,
            "total_pending": monthly_salary_pending,
            "faculty_count": monthly_faculty_count,
            "disbursed_count": monthly_disbursed_count,
            "disbursement_rate_percent": round((monthly_salary_disbursed / max(1.0, monthly_salary_liability)) * 100, 1) if monthly_salary_liability > 0 else 0.0
        },
        
        # Explicit Yearly Salary
        "yearly_salary": {
            "academic_year": curr_academic_year,
            "total_liability": yearly_salary_liability,
            "total_disbursed": yearly_salary_disbursed,
            "total_pending": yearly_salary_pending,
            "total_disbursements_count": yearly_disbursements_count,
            "faculty_count": total_faculty_count,
            "disbursement_rate_percent": round((yearly_salary_disbursed / max(1.0, yearly_salary_liability)) * 100, 1) if yearly_salary_liability > 0 else 0.0
        },
        
        # Backwards compatible blocks
        "fees_counter": fees_counter,
        "salary_counter": salary_counter,
        "accounts_credentials_info": get_accounts_credentials_info(norm_branch)
    }

class UpdatePasswordRequest(BaseModel):
    branch: str
    password: str

@router.get("/database-credentials")
async def get_database_credentials_endpoint(
    token: str = Depends(oauth2_scheme)
):
    """
    Returns the branch accounts credentials stored in the MongoDB 'branch_accounts' collection.
    """
    await get_current_user(token)
    from app.core.accounts_config import ensure_branch_accounts_in_db
    await ensure_branch_accounts_in_db()
    
    from app.models.branch_account import BranchAccount
    accounts = await BranchAccount.find_all().to_list()
    return [
        {
            "id": str(a.id),
            "branch": a.branch,
            "accounts_id": a.accounts_id,
            "password": a.password,
            "role": a.role,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            "database_collection": "branch_accounts",
            "database_name": "academy_management"
        }
        for a in accounts
    ]

@router.put("/database-credentials")
async def update_database_credentials_endpoint(
    req: UpdatePasswordRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Updates the password for a branch in the MongoDB 'branch_accounts' collection.
    """
    current_user = await get_current_user(token)
    if (current_user.role or "").lower() not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Only Super Admin and Admin can update accounts passwords.")

    from app.core.accounts_config import ensure_branch_accounts_in_db
    await ensure_branch_accounts_in_db()

    from app.models.branch_account import BranchAccount
    from app.core.branch_config import normalize_branch
    from datetime import datetime

    norm_b = normalize_branch(req.branch)
    account = await BranchAccount.find_one(BranchAccount.branch == norm_b)
    if not account:
        raise HTTPException(status_code=404, detail=f"No account record found for {req.branch}")

    account.password = req.password.strip()
    account.updated_at = datetime.utcnow()
    await account.save()

    return {
        "success": True,
        "message": f"Password updated to '{account.password}' for {account.branch} in MongoDB collection 'branch_accounts'.",
        "branch": account.branch,
        "password": account.password
    }
