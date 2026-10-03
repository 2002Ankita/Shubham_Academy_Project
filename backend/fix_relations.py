import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId, DBRef
from datetime import datetime

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['academy_management']
    
    # 1. Fix Student 1 (course -> standard)
    await db.students.update_many(
        {'course': {'$exists': True}},
        {'$rename': {'course': 'standard'}, '$set': {'branch': 'Tarabai Park'}}
    )
    
    # 2. Get valid students
    students = await db.students.find().to_list(100)
    if not students:
        print("No students")
        return
        
    valid_student_ids = [s['_id'] for s in students]
    
    # 3. Fix Fee Payments
    payments = await db.fee_payments.find().to_list(100)
    for i, p in enumerate(payments):
        stu_ref = p.get('student')
        if not stu_ref or stu_ref.id not in valid_student_ids:
            # assign to a valid student
            new_id = valid_student_ids[i % len(valid_student_ids)]
            await db.fee_payments.update_one({'_id': p['_id']}, {'$set': {'student': DBRef('students', new_id)}})
            
    # 4. Insert default Fee Structures so total fees show up properly
    # Get all distinct combinations
    combinations = set()
    for s in students:
        st = s.get('standard', '12th Science')
        ba = s.get('batch', '11th pcm tarabai park')
        br = s.get('branch', 'Tarabai Park')
        ay = s.get('academic_year', '2023-2024')
        combinations.add((st, ba, br, ay))
        
    for (st, ba, br, ay) in combinations:
        existing = await db.fee_structures.find_one({'standard': st, 'batch': ba, 'branch': br, 'academic_year': ay})
        if not existing:
            await db.fee_structures.insert_one({
                'standard': st,
                'batch': ba,
                'branch': br,
                'academic_year': ay,
                'total_fee': 45000.0,
                'installment_amount': 15000.0,
                'number_of_installments': 3,
                'due_date': datetime.utcnow(),
                'late_fee': 0.0
            })
            
    print("Database data fixed completely!")

if __name__ == '__main__':
    asyncio.run(main())
