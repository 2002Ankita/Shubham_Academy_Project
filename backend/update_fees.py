import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['academy_management']
    await db.students.update_many({'total_fees': {'$exists': False}}, {'$set': {'total_fees': 45000.0}})
    print('Done')

if __name__ == '__main__':
    asyncio.run(main())
