import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.teacher import Teacher
from app.models.user import User
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Teacher])
    
    user = await User.find_one(User.role == "TEACHER")
    if user:
        print("Teacher email:", user.email, "pass: password123")
    else:
        print("No teacher user found")

if __name__ == '__main__':
    asyncio.run(main())
