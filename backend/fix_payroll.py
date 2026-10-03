import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.teacher import Teacher
from app.models.salary import SalaryPayment
from app.models.user import User
from beanie import init_beanie
from datetime import datetime

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Teacher, SalaryPayment])
    
    current_month = datetime.now().strftime("%B %Y")
    teachers = await Teacher.find_all().to_list()
    
    for t in teachers:
        existing = await SalaryPayment.find_one(SalaryPayment.teacher.id == t.id, SalaryPayment.month_name == current_month)
        if not existing:
            base = t.hourly_rate * 160 if hasattr(t, 'hourly_rate') and t.hourly_rate else 60000
            if not base or base < 1000:
                base = 60000
                
            new_s = SalaryPayment(
                teacher=t,
                month_name=current_month,
                base_salary=base,
                allowances=0,
                deductions=0,
                net_payable=base,
                status="Processing",
                transaction_ref="--"
            )
            await new_s.insert()
            print(f"Added {t.employee_id} to {current_month} payroll")
    print("Done")

if __name__ == '__main__':
    asyncio.run(main())
