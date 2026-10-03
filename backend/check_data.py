import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    users = await db.users.find().to_list(None)
    batches = await db.batches.find().to_list(None)
    print('Users:')
    for u in users:
        print(f"  {u.get('full_name')} (Email: {u.get('email')}, Role: {u.get('role')})")
    print('Batches:')
    for b in batches:
        print(f"  {b.get('name')} (Teacher: '{b.get('teacher_name')}')")

if __name__ == '__main__':
    asyncio.run(main())
