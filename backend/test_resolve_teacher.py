import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.models.attendance import Attendance
from app.services.teacher_service import resolve_teacher
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Student, Teacher, Attendance])
    
    # Get any teacher user
    user = await User.find_one(User.role == "TEACHER")
    if user:
        print("Found teacher user:", user.id)
        teacher = await resolve_teacher(str(user.id))
        print("Resolved teacher:", teacher)
    else:
        print("No teacher user found")

if __name__ == '__main__':
    asyncio.run(main())
