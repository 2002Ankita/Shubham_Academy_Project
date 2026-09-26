from app.models.salary import SalaryPayment
from app.models.teacher import Teacher
from fastapi import HTTPException

async def get_salary_details(teacher_id: str) -> list[SalaryPayment]:
    teacher = await Teacher.get(teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    return await SalaryPayment.find(SalaryPayment.teacher.id == teacher.id).to_list()
