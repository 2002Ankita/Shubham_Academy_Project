import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User])
    
    user = await User.find_one(User.email == "teacher1@test.com")
    if user:
        user.is_active = True
        await user.save()
        print("Teacher is now active.")

if __name__ == '__main__':
    asyncio.run(main())
