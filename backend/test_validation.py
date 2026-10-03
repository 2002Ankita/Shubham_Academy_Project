import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.student import Student
from app.schemas.student import StudentResponse
from app.models.user import User
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Student])
    
    students = await Student.find_all().to_list()
    for student in students:
        user_obj = student.user
        if not isinstance(user_obj, User):
            user_obj = await User.get(student.user.ref.id)
            
        data = {
            "id": str(student.id),
            "student_id": student.student_id,
            "full_name": user_obj.full_name if user_obj else "",
            "email": user_obj.email if user_obj else None,
            "mobile_number": student.mobile_number,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "address": student.address,
            "parent_name": student.parent_name,
            "parent_mobile": student.parent_mobile,
            "standard": student.standard,
            "batch": student.batch,
            "branch": student.branch,
            "academic_year": student.academic_year,
            "rfid_tag": student.rfid_tag,
            "admission_date": student.admission_date,
        }
        
        try:
            StudentResponse(**data)
            print(f"Student {data['student_id']} OK")
        except Exception as e:
            print(f"Student {data['student_id']} FAILED: {e}")

if __name__ == '__main__':
    asyncio.run(main())
