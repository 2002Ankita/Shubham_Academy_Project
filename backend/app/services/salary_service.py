from app.models.salary import SalaryPayment
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
        "status": s.status,
        "disbursedDate": s.disbursed_date.strftime("%Y-%m-%d") if s.disbursed_date else "--",
        "transactionRef": s.transaction_ref
    }

async def get_all_salaries() -> list[dict]:
    salaries = await SalaryPayment.find_all().to_list()
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
        await s.save()
        return await _format_salary(s)
    except:
        raise HTTPException(status_code=404, detail="Salary not found")

async def disburse_salary(id: str) -> dict:
    try:
        s = await SalaryPayment.get(ObjectId(id))
        if not s:
            raise Exception()
        s.status = "Disbursed"
        s.disbursed_date = datetime.utcnow()
        s.transaction_ref = f"NEFT-{random.randint(1000000, 9999999)}"
        await s.save()
        return await _format_salary(s)
    except:
        raise HTTPException(status_code=404, detail="Salary not found")

async def generate_monthly_salaries(month_name: str):
    teachers = await Teacher.find_all().to_list()
    for t in teachers:
        # Check if already exists for this month
        existing = await SalaryPayment.find_one(SalaryPayment.teacher.id == t.id, SalaryPayment.month_name == month_name)
        if not existing:
            base = getattr(t, 'base_salary', 60000)
            if not base or base < 1000:
                base = 60000
            new_s = SalaryPayment(
                teacher=t,
                month_name=month_name,
                base_salary=base,
                allowances=0,
                deductions=0,
                net_payable=base,
                status="Processing",
                transaction_ref="--"
            )
            await new_s.insert()
