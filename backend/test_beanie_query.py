import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from bson import ObjectId
from app.models.user import User
from app.models.student import Student
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Student])

    student = await Student.find_one()
    if not student:
        print("No student found")
        return
    
    # Try querying by user ID
    user_id = student.user.ref.id
    print("Found user_id:", user_id)
    
    # Query method 1
    res1 = await Student.find_one({"user.$id": user_id})
    print("Method 1 (user.$id):", "Found" if res1 else "Not Found")
    
    # Query method 2
    res2 = await Student.find_one(Student.user.id == user_id)
    print("Method 2 (Student.user.id):", "Found" if res2 else "Not Found")
    
    # Query method 3
    res3 = await Student.find_one({"user.id": user_id})
    print("Method 3 (user.id):", "Found" if res3 else "Not Found")

if __name__ == "__main__":
    asyncio.run(main())
