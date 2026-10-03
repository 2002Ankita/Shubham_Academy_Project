import asyncio
from app.core.database import init_db
from app.models.student import Student
from app.models.user import User
from bson import ObjectId

async def main():
    await init_db()
    uid = "6ac09074ea60755a98c91261"
    user = await User.get(ObjectId(uid))
    print("User:", user.full_name if user else "Not found")
    if user:
        student = await Student.find_one({"user.$id": ObjectId(uid)})
        print("Student query 1:", student)
        student2 = await Student.find_one(Student.user.id == ObjectId(uid))
        print("Student query 2:", student2.student_id if student2 else None)
        
        # also print all students again
        all_s = await Student.find_all().to_list()
        for s in all_s:
            if str(s.user.ref.id) == uid:
                print("Found match in loop! Batch is:", s.batch, s.student_id)

if __name__ == "__main__":
    asyncio.run(main())
