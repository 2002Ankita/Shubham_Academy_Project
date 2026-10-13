import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from pprint import pprint

async def show_data():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("\n" + "="*50)
    print(" BATCHES IN MONGODB ".center(50, "="))
    print("="*50)
    async for batch in db.batches.find():
        print(f"Batch Name: {batch.get('name')}, Standard: {batch.get('standard')}, Subject: {batch.get('subject')}, Room: {batch.get('room')}")
        
    print("\n" + "="*50)
    print(" TEACHERS IN MONGODB ".center(50, "="))
    print("="*50)
    async for teacher in db.teachers.find():
        print(f"Employee ID: {teacher.get('employee_id')}, Mobile: {teacher.get('mobile_number')}, Status: {teacher.get('status')}")
    
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(show_data())
