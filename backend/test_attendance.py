import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    await init_beanie(database=client.academy_management, document_models=[Attendance, Student, Teacher, User])
    
    docs = await Attendance.find_all().to_list()
    print(f"Total Attendance records: {len(docs)}")
    for d in docs:
        t_id = d.teacher.ref.id if d.teacher else None
        s_id = d.student.ref.id if d.student else None
        print(f"ID: {d.id}, Date: {d.date}, Teacher: {t_id}, Student: {s_id}")

if __name__ == "__main__":
    asyncio.run(main())
