from app.models.salary import SalaryPayment, Installment
from app.models.teacher import Teacher
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId
import random

async def _format_salary(s: SalaryPayment) -> dict:
    teacher_obj = None
    if isinstance(s.teacher, Teacher):
        teacher_obj = s.teacher
    elif getattr(s, 'teacher', None):
        teacher_obj = await Teacher.get(s.teacher.ref.id)
        s.teacher = teacher_obj
        
    user_name = ""
    if teacher_obj and getattr(teacher_obj, "user", None):
        from app.models.user import User
        user_obj = teacher_obj.user if isinstance(teacher_obj.user, User) else await User.get(teacher_obj.user.ref.id)
        if user_obj:
            user_name = user_obj.full_name

    subjects = ", ".join(teacher_obj.subjects) if teacher_obj and getattr(teacher_obj, 'subjects', None) else "General"

    return {
        "id": str(s.id),
        "teacherId": str(teacher_obj.id) if teacher_obj else "",
        "teacherName": user_name,
        "subject": subjects,
        "month": s.month_name,
        "baseSalary": s.base_salary,
        "allowances": s.allowances,
        "deductions": s.deductions,
        "netPayable": s.net_payable,
        "workingHours": getattr(s, 'working_hours', 160.0),
        "amountPaid": getattr(s, 'amount_paid', 0.0),
        "amountPending": max(0.0, s.net_payable - getattr(s, 'amount_paid', 0.0)),
        "status": s.status,
        "disbursedDate": s.disbursed_date.strftime("%Y-%m-%d") if s.disbursed_date else "--",
        "transactionRef": s.transaction_ref,
        "installments": [
            {
                "amount": inst.amount,
                "date": inst.date.strftime("%Y-%m-%d %H:%M"),
                "transactionRef": inst.transaction_ref
            }
            for inst in getattr(s, 'installments', [])
        ]
    }

async def get_all_salaries() -> list[dict]:
    salaries = await SalaryPayment.find_all().to_list()
    return [await _format_salary(s) for s in salaries]

async def get_my_salaries(user_id: ObjectId) -> list[dict]:
    teacher = await Teacher.find_one(Teacher.user.id == user_id)
    if not teacher:
        return []
    salaries = await SalaryPayment.find(SalaryPayment.teacher.id == teacher.id).to_list()
    return [await _format_salary(s) for s in salaries]

async def update_salary(id: str, base_salary: float, allowances: float, deductions: float, net_payable: float) -> dict:
    try:
        s = await SalaryPayment.get(ObjectId(id))
        if not s:
            raise Exception()
        s.base_salary = base_salary
        s.allowances = allowances
        s.deductions = deductions
        s.net_payable = net_payable
        s.amount_pending = net_payable - getattr(s, 'amount_paid', 0.0)
        await s.save()
        return await _format_salary(s)
    except:
        raise HTTPException(status_code=404, detail="Salary not found")

async def disburse_salary(id: str, amount: float = None) -> dict:
    try:
        s = await SalaryPayment.get(ObjectId(id))
        if not s:
            raise Exception()
            
        current_paid = getattr(s, 'amount_paid', 0.0)
        
        if amount is not None:
            s.amount_paid = current_paid + amount
            payment_amount = amount
        else:
            s.amount_paid = s.net_payable
            payment_amount = s.net_payable - current_paid
            
        s.amount_pending = s.net_payable - s.amount_paid
        
        if s.amount_pending <= 0:
            s.amount_pending = 0.0
            s.amount_paid = s.net_payable
            s.status = "Disbursed"
        else:
            s.status = "Partially Paid"
            
        s.disbursed_date = datetime.utcnow()
        txn_ref = f"NEFT-{random.randint(1000000, 9999999)}"
        if s.transaction_ref == "--" or not s.transaction_ref:
            s.transaction_ref = txn_ref
            
        if not hasattr(s, 'installments') or s.installments is None:
            s.installments = []
            
        s.installments.append(Installment(
            amount=payment_amount,
            date=datetime.utcnow(),
            transaction_ref=txn_ref
        ))
        await s.save()
        return await _format_salary(s)
    except:
        raise HTTPException(status_code=404, detail="Salary not found")

from app.models.attendance import Attendance
from datetime import timedelta

async def generate_monthly_salaries(month_name: str):
    from app.services.attendance_service import get_teachers_monthly_hours_summary
    summary = await get_teachers_monthly_hours_summary(month_name)
    teachers = await Teacher.find_all().to_list()
    teacher_by_id = {str(t.id): t for t in teachers}

    month_label = summary.get("month_label") or month_name

    for f in summary.get("faculty_records", []):
        tid = f.get("teacher_id")
        t = teacher_by_id.get(tid)
        if not t:
            continue
        working_hours = float(f.get("total_hours", 0.0) or 0.0)
        base = float(f.get("calculated_salary", 0.0) or 0.0)
        if base <= 0 and working_hours > 0:
            base = round(working_hours * float(f.get("hourly_rate", 500.0) or 500.0), 2)

        existing = await SalaryPayment.find_one(SalaryPayment.teacher.id == t.id, SalaryPayment.month_name == month_label)
        
        if not existing:
            new_s = SalaryPayment(
                teacher=t,
                month_name=month_label,
                base_salary=base,
                allowances=0,
                deductions=0,
                net_payable=base,
                amount_paid=0.0,
                amount_pending=base,
                working_hours=working_hours,
                status="Processing",
                transaction_ref="--"
            )
            await new_s.insert()
        elif existing.status in ["Processing", "Partially Paid"]:
            existing.base_salary = base
            existing.net_payable = base + (existing.allowances or 0) - (existing.deductions or 0)
            existing.amount_pending = max(0.0, existing.net_payable - (getattr(existing, 'amount_paid', 0.0) or 0.0))
            existing.working_hours = working_hours
            await existing.save()
