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
    try:
        month_date = datetime.strptime(month_name, "%B %Y")
        start_date = month_date
        if month_date.month == 12:
            end_date = month_date.replace(year=month_date.year+1, month=1)
        else:
            end_date = month_date.replace(month=month_date.month+1)
    except ValueError:
        start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=31)

    teachers = await Teacher.find_all().to_list()
    for t in teachers:
        att_records = await Attendance.find(
            Attendance.teacher.id == t.id,
            Attendance.date >= start_date,
            Attendance.date < end_date
        ).to_list()
        
        total_hours = 0.0
        for att in att_records:
            if att.check_in_time and att.check_out_time:
                diff = (att.check_out_time - att.check_in_time).total_seconds() / 3600.0
                total_hours += max(0.0, diff)
        
        working_hours = total_hours if total_hours > 0 else 160.0
        
        if hasattr(t, 'hourly_rate') and t.hourly_rate:
            base = t.hourly_rate * working_hours
        else:
            base = getattr(t, 'monthly_salary', 60000)
            if not base or base < 1000:
                base = 60000

        existing = await SalaryPayment.find_one(SalaryPayment.teacher.id == t.id, SalaryPayment.month_name == month_name)
        
        if not existing:
            new_s = SalaryPayment(
                teacher=t,
                month_name=month_name,
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
            existing.net_payable = base + existing.allowances - existing.deductions
            existing.amount_pending = existing.net_payable - getattr(existing, 'amount_paid', 0.0)
            existing.working_hours = working_hours
            await existing.save()
