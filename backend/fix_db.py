import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['academy_management']
    
    # Fix students
    cursor = db.students.find({})
    seen_mobiles = set()
    async for doc in cursor:
        mob = doc.get("mobile_number", "")
        # clean to 10 digits
        clean_mob = ''.join(filter(str.isdigit, mob))[-10:]
        if len(clean_mob) < 10:
            clean_mob = clean_mob.zfill(10)
        
        while clean_mob in seen_mobiles:
            # increment last digit to make it unique
            clean_mob = str(int(clean_mob) + 1).zfill(10)
            
        seen_mobiles.add(clean_mob)
        
        # update doc
        await db.students.update_one({'_id': doc['_id']}, {'$set': {'mobile_number': clean_mob}})
        
        # also fix parent_mobile if exists
        pmob = doc.get("parent_mobile", "")
        if pmob:
            clean_pmob = ''.join(filter(str.isdigit, pmob))[-10:]
            if len(clean_pmob) < 10:
                clean_pmob = clean_pmob.zfill(10)
            await db.students.update_one({'_id': doc['_id']}, {'$set': {'parent_mobile': clean_pmob}})
            
    print("Students fixed")

    # Fix teachers
    cursor = db.teachers.find({})
    seen_mobiles = set()
    async for doc in cursor:
        mob = doc.get("mobile_number", "")
        # clean to 10 digits
        clean_mob = ''.join(filter(str.isdigit, mob))[-10:]
        if len(clean_mob) < 10:
            clean_mob = clean_mob.zfill(10)
        
        while clean_mob in seen_mobiles:
            # increment last digit to make it unique
            clean_mob = str(int(clean_mob) + 1).zfill(10)
            
        seen_mobiles.add(clean_mob)
        
        # update doc
        await db.teachers.update_one({'_id': doc['_id']}, {'$set': {'mobile_number': clean_mob}})

    print("Teachers fixed")

if __name__ == '__main__':
    asyncio.run(main())
