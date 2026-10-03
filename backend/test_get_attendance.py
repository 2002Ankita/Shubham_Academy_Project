import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.services.attendance_service import get_teacher_attendance

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    await init_beanie(database=client.academy_management, document_models=[Attendance, Student, Teacher, User])
    
    teachers = await Teacher.find_all().to_list()
    for teacher in teachers:
        res = await get_teacher_attendance(str(teacher.id))
        print(f"Teacher {teacher.id} attendance: {len(res)}")

if __name__ == "__main__":
    asyncio.run(main())
