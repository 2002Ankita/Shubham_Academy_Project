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
    for the Accounts dashboard across all academic years, including full calendar month breakdown.
    """
    current_user = await get_current_user(token)
    norm_branch = normalize_branch(branch or current_user.branch)
    
    import re
    from datetime import datetime
    now = datetime.utcnow()
    current_month_name = now.strftime("%B %Y")
    
    # 1. Determine and Detect All Available Academic Years (past & unlimited upcoming)
    from app.models.student import Student
    from app.models.fees import FeePayment
    from app.models.salary import SalaryPayment
    from app.models.teacher import Teacher
    from app.services.salary_service import ensure_current_month_salaries, _format_salary

    curr_cal_year = now.year
    # Dynamically generate the full 100-year 2000s series (from 2000-2001 through 2100-2101)
    standard_years = [f"{y}-{y+1}" for y in range(2000, 2101)]
    detected_years_set = set(standard_years)

    if academic_year and academic_year.strip().upper() not in ["ALL", "ALL YEARS", "LIFETIME"]:
        detected_years_set.add(academic_year.strip())

    # Load ALL students across DB to accurately resolve student DBRefs
    from app.services.student_service import student_matches_branch
    from app.models.fees import FeeStructure
    from app.services.fee_service import _lookup_student_fee

    structures = await FeeStructure.find_all().to_list() if hasattr(FeeStructure, 'find_all') else []
    all_students = await Student.find_all().to_list() if hasattr(Student, 'find_all') else []
    student_id_branch_map = {str(s.id): normalize_branch(getattr(s, "branch", None)) for s in all_students}

    # Filter students for active branch using unified student_matches_branch
    branch_students = [
        s for s in all_students
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or student_matches_branch(s, norm_branch)
    ]

    for s in branch_students:
        s_ay = getattr(s, "academic_year", None)
        if s_ay and isinstance(s_ay, str) and "-" in s_ay:
            detected_years_set.add(s_ay.strip())

    # Query all payments for this branch
    all_payments = await FeePayment.find_all().to_list() if hasattr(FeePayment, 'find_all') else []
    branch_payments = []
    for p in all_payments:
        p_br = normalize_branch(getattr(p, "branch", None))
        if not p_br and getattr(p, "student", None):
            ref = getattr(p.student, "ref", None)
            s_id = str(getattr(ref, "id", None)) if ref else str(getattr(p.student, "id", ""))
            p_br = student_id_branch_map.get(s_id)
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or p_br == norm_branch:
            branch_payments.append(p)
            pay_ay = getattr(p, "academic_year", None)
            if pay_ay and isinstance(pay_ay, str) and "-" in pay_ay:
                detected_years_set.add(pay_ay.strip())
            elif getattr(p, "payment_date", None):
                py = p.payment_date.year
                pm = p.payment_date.month
                cal_ay = f"{py}-{py+1}" if pm >= 4 else f"{py-1}-{py}"
                detected_years_set.add(cal_ay)

    # Query teachers and salaries
    all_teachers = await Teacher.find_all().to_list() if hasattr(Teacher, 'find_all') else []
    branch_teachers = [
        t for t in all_teachers
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or normalize_branch(getattr(t, "branch", None)) == norm_branch
    ]
    teacher_id_set = {str(t.id) for t in branch_teachers}
    total_faculty_count = len(branch_teachers)

    all_salaries = await SalaryPayment.find_all().to_list() if hasattr(SalaryPayment, 'find_all') else []
    branch_salaries = []
    for sal in all_salaries:
        t_id = ""
        if getattr(sal, "teacher", None):
            ref = getattr(sal.teacher, "ref", None)
            t_id = str(getattr(ref, "id", None)) if ref else str(getattr(sal.teacher, "id", ""))
        if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or t_id in teacher_id_set:
            branch_salaries.append(sal)
            m_parts = (getattr(sal, "month_name", "") or "").split()
            if len(m_parts) == 2 and m_parts[1].isdigit():
                sy = int(m_parts[1])
                detected_years_set.add(f"{sy}-{sy+1}")
                detected_years_set.add(f"{sy-1}-{sy}")

    # Build sorted academic years list (newest first)
    available_academic_years = sorted(list(detected_years_set), reverse=True)

    # 2. Resolve Active Academic Year & Generate Months
    curr_academic_year = (academic_year or "").strip()
    if not curr_academic_year or curr_academic_year.upper() in ["DEFAULT", "CURRENT"]:
        curr_y = now.year
        curr_academic_year = f"{curr_y}-{curr_y+1}" if now.month >= 4 else f"{curr_y-1}-{curr_y}"
        if curr_academic_year not in available_academic_years:
            curr_academic_year = "2026-2027"

    is_all_academic_years = curr_academic_year.upper() in ["ALL", "ALL YEARS", "LIFETIME", "CONSOLIDATED"]

    academic_months = []
    ay_start_dt = None
    ay_end_dt = None

    if not is_all_academic_years:
        ay_match = re.match(r"^(\d{4})-(\d{4})$", curr_academic_year)
        if ay_match:
            y1 = int(ay_match.group(1))
            y2 = int(ay_match.group(2))
            ay_start_dt = datetime(y1, 4, 1, 0, 0, 0)
            ay_end_dt = datetime(y2, 4, 1, 0, 0, 0)
            academic_months = [
                f"April {y1}", f"May {y1}", f"June {y1}", f"July {y1}",
                f"August {y1}", f"September {y1}", f"October {y1}",
                f"November {y1}", f"December {y1}", f"January {y2}",
                f"February {y2}", f"March {y2}"
            ]
        else:
            single_match = re.match(r"^(\d{4})$", curr_academic_year)
            if single_match:
                sy = int(single_match.group(1))
                ay_start_dt = datetime(sy, 1, 1, 0, 0, 0)
                ay_end_dt = datetime(sy + 1, 1, 1, 0, 0, 0)
                academic_months = [
                    f"January {sy}", f"February {sy}", f"March {sy}", f"April {sy}",
                    f"May {sy}", f"June {sy}", f"July {sy}", f"August {sy}",
                    f"September {sy}", f"October {sy}", f"November {sy}", f"December {sy}"
                ]
    else:
        all_month_names = set()
        for sal in branch_salaries:
            if sal.month_name: all_month_names.add(sal.month_name)
        for p in branch_payments:
            if getattr(p, "payment_date", None):
                all_month_names.add(p.payment_date.strftime("%B %Y"))
        academic_months = sorted(list(all_month_names))

    # Resolve target month
    target_month = month
    if not target_month or target_month.upper() in ["CURRENT", "DEFAULT"]:
        if current_month_name in academic_months:
            target_month = current_month_name
        elif academic_months:
            target_month = academic_months[0]
        else:
            target_month = current_month_name

    is_all_months = target_month.upper() in ["ALL", "FULL YEAR", "YEARLY"]

    # 3. Filter Students strictly for the selected Academic Year (Data varies cleanly by year)
    if is_all_academic_years:
        selected_students = branch_students
    else:
        matched = []
        for s in branch_students:
            s_ay = getattr(s, "academic_year", None)
            adm = getattr(s, "admission_date", None)
            if s_ay == curr_academic_year:
                matched.append(s)
            elif curr_academic_year in ["2026-2027", "2025-2026"]:
                if not s_ay or (adm and datetime(2026, 4, 1) <= adm < datetime(2027, 4, 1)):
                    matched.append(s)
            elif ay_start_dt and ay_end_dt and adm and ay_start_dt <= adm < ay_end_dt:
                matched.append(s)
            elif not s_ay and not adm:
                matched.append(s)
        selected_students = matched

    # Build student payment map from FeePayment records
    paid_map = {}
    for p in all_payments:
        s_id = None
        try:
            if hasattr(p, "student") and p.student:
                if hasattr(p.student, "ref") and p.student.ref and hasattr(p.student.ref, "id"):
                    s_id = str(p.student.ref.id)
                elif hasattr(p.student, "id"):
                    s_id = str(p.student.id)
                else:
                    s_id = str(p.student)
        except Exception:
            pass
        if s_id:
            paid_map[s_id] = paid_map.get(s_id, 0.0) + float(getattr(p, "amount_paid", 0.0) or 0.0)

    yearly_expected_fees = 0.0
    yearly_collected_fees = 0.0
    yearly_pending_dues = 0.0
    overdue_students_count = 0

    for s in selected_students:
        s_id_str = str(s.id)
        tot = await _lookup_student_fee(s, structures)
        calc_paid = paid_map.get(s_id_str, 0.0)
        doc_paid = float(getattr(s, "paid_fees", 0.0) or 0.0)
        paid = max(calc_paid, doc_paid)
        doc_rem = getattr(s, "remaining_fees", None)
        if doc_rem is not None and float(doc_rem) <= 0 and paid > 0:
            rem = 0.0
        else:
            rem = max(0.0, tot - paid)

        # Sync student document in database so it matches FeeStructure & FeePayment
        if s.paid_fees != paid or s.remaining_fees != rem or s.total_fees != tot:
            try:
                s.paid_fees = paid
                s.remaining_fees = rem
                s.total_fees = tot
                await s.save()
            except Exception:
                pass

        yearly_expected_fees += tot
        yearly_collected_fees += paid
        yearly_pending_dues += rem
        if rem > 0.01:
            overdue_students_count += 1

    # Filter fee payments for this academic year
    year_payments = []
    for p in branch_payments:
        if is_all_academic_years:
            year_payments.append(p)
        else:
            p_date = getattr(p, "payment_date", None)
            p_ay = getattr(p, "academic_year", None)
            if p_ay == curr_academic_year:
                year_payments.append(p)
            elif p_date and ay_start_dt and ay_end_dt and ay_start_dt <= p_date < ay_end_dt:
                year_payments.append(p)

    # 4. Monthly Fee Calculations (Data varies cleanly by month)
    month_start_dt = None
    month_end_dt = None
    if not is_all_months:
        try:
            m_dt = datetime.strptime(target_month, "%B %Y")
            month_start_dt = datetime(m_dt.year, m_dt.month, 1)
            month_end_dt = datetime(m_dt.year + 1, 1, 1) if m_dt.month == 12 else datetime(m_dt.year, m_dt.month + 1, 1)
        except Exception:
            month_start_dt = None
            month_end_dt = None

    selected_month_payments = []
    if is_all_months:
        selected_month_payments = year_payments
    elif month_start_dt and month_end_dt:
        for p in branch_payments:
            p_date = getattr(p, "payment_date", None)
            if p_date and month_start_dt <= p_date < month_end_dt:
                selected_month_payments.append(p)

    monthly_collected_fees = sum(float(getattr(p, "amount_paid", 0.0) or 0.0) for p in selected_month_payments)

    if is_all_months:
        monthly_expected_fees = yearly_expected_fees
        monthly_pending_fees = yearly_pending_dues
    else:
        monthly_expected_fees = round(yearly_expected_fees / 10.0, 2) if yearly_expected_fees > 0 else 0.0
        if monthly_collected_fees > monthly_expected_fees:
            monthly_expected_fees = monthly_collected_fees
        monthly_pending_fees = max(0.0, round(monthly_expected_fees - monthly_collected_fees, 2))

    # 5. Teacher Salary Calculations for Selected Academic Year & Month
    if not is_all_months and target_month in academic_months:
        try:
            await ensure_current_month_salaries(target_month)
        except Exception as e:
            print("Accounts summary salary ensure error:", e)

    # Filter salaries belonging to this academic year
    year_salaries = []
    for sal in branch_salaries:
        if is_all_academic_years or sal.month_name in academic_months:
            year_salaries.append(sal)

    yearly_salary_liability = 0.0
    yearly_salary_disbursed = 0.0
    yearly_salary_pending = 0.0
    yearly_disbursements_count = 0

    for sal in year_salaries:
        net = float(getattr(sal, 'net_payable', 0.0) or getattr(sal, 'base_salary', 0.0) or 0.0)
        paid = float(getattr(sal, 'amount_paid', 0.0) or 0.0)
        pend = float(getattr(sal, 'amount_pending', max(0.0, net - paid)) or 0.0)
        yearly_salary_liability += net
        yearly_salary_disbursed += paid
        yearly_salary_pending += pend
        if getattr(sal, 'status', '') == 'Disbursed' or (paid > 0 and pend == 0):
            yearly_disbursements_count += 1

    # Monthly salary calculations
    formatted_month_salaries = []
    if is_all_months:
        month_salaries = year_salaries
        monthly_salary_liability = yearly_salary_liability
        monthly_salary_disbursed = yearly_salary_disbursed
        monthly_salary_pending = yearly_salary_pending
        monthly_disbursed_count = yearly_disbursements_count
        monthly_faculty_count = total_faculty_count
    else:
        # Re-fetch exact month salaries so newly generated or updated records are live
        raw_month_salaries = await SalaryPayment.find(SalaryPayment.month_name == target_month).to_list()
        month_salaries = []
        for sal in raw_month_salaries:
            t_id = ""
            if getattr(sal, "teacher", None):
                ref = getattr(sal.teacher, "ref", None)
                t_id = str(getattr(ref, "id", None)) if ref else str(getattr(sal.teacher, "id", ""))
            if not norm_branch or norm_branch.lower() in ["all", "super", "both", "all campuses"] or t_id in teacher_id_set:
                month_salaries.append(sal)

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
            try:
                formatted_month_salaries.append(await _format_salary(sal))
            except Exception:
                pass

    # 6. Generate Calendar Month Breakdown for UI calendar ribbon
    monthly_calendar_stats = []
    for am in academic_months:
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

        am_salaries = [s for s in branch_salaries if s.month_name == am]
        am_salary_disbursed = sum(float(getattr(s, "amount_paid", 0.0) or 0.0) for s in am_salaries)
        am_salary_liability = sum(float(getattr(s, "net_payable", 0.0) or getattr(s, "base_salary", 0.0) or 0.0) for s in am_salaries)

        parts = am.split()
        short_label = f"{parts[0][:3]} '{parts[1][-2:]}" if len(parts) == 2 else am

        monthly_calendar_stats.append({
            "month_name": am,
            "short_name": short_label,
            "fees_collected": am_collected,
            "salary_liability": am_salary_liability,
            "salary_disbursed": am_salary_disbursed,
            "is_current": (am == current_month_name),
            "is_selected": (am == target_month),
            "faculty_count": len(am_salaries) or total_faculty_count
        })

    fees_counter = {
        "total_expected": yearly_expected_fees,
        "total_collected": yearly_collected_fees,
        "total_pending": yearly_pending_dues,
        "overdue_students_count": overdue_students_count,
        "collection_rate_percent": round((yearly_collected_fees / max(1.0, yearly_expected_fees)) * 100, 1) if yearly_expected_fees > 0 else 0.0,
        "total_students": len(selected_students)
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
        "available_academic_years": available_academic_years,
        "is_all_months": is_all_months,
        "is_all_academic_years": is_all_academic_years,
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
            "total_students": len(selected_students),
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
        
        "selected_month_salaries": formatted_month_salaries,
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
