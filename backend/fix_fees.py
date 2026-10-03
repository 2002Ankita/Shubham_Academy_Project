import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['academy_management']
    cursor = db.fee_structures.find()
    async for doc in cursor:
        course = doc.get('course')
        updates = {}
        if course:
            updates['standard'] = course
        updates['branch'] = 'Tarabai Park'
        
        set_op = updates
        unset_op = {}
        if course:
            unset_op['course'] = ""
            
        update_query = {"$set": set_op}
        if unset_op:
            update_query["$unset"] = unset_op
            
        await db.fee_structures.update_one({'_id': doc['_id']}, update_query)
    print('Updated')

if __name__ == '__main__':
    asyncio.run(main())
