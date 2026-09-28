import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.teacher import Teacher
from app.models.user import User
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Teacher])
    
    teachers = await Teacher.find_all().to_list()
    print("Teachers:")
    for t in teachers:
        print(f"Teacher: {t.id} - UserRef: {t.user.ref.id if t.user else None}")
        
    users = await User.find(User.role == "TEACHER").to_list()
    print("\nUsers (TEACHER role):")
    for u in users:
        print(f"User: {u.id} - {u.email} - {u.full_name}")

if __name__ == "__main__":
    asyncio.run(main())
