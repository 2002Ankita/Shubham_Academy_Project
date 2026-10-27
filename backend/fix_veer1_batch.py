import asyncio
import sys
from bson import ObjectId

backend_dir = r"c:\Users\HP\Desktop\Shubham_Academy_Project\backend"
sys.path.insert(0, backend_dir)

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.batch import Batch

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[User, Teacher, Student, Batch])

    print("Connecting teacher veer 1 and batch 11th pcmb Mangalvar Peth...")

    # 1. Find teacher veer 1
    teacher_veer = await Teacher.get(ObjectId("6abdf4c65b6ebf81b6f98888"))
    if not teacher_veer:
        print("Teacher veer 1 not found!")
        return

    # 2. Find batch 11th pcmb Mangalvar Peth
    batch_mp = await Batch.get(ObjectId("6ae039c448955f0b422973ce"))
    if not batch_mp:
        print("Batch 11th pcmb Mangalvar Peth not found!")
        return

    # Update batch timetable with Mathematics slot for veer 1
    clean_time = "08:00 AM – 10:30 AM"
    batch_mp.time = clean_time
    batch_mp.teacher = teacher_veer
    batch_mp.teacher_name = "veer 1"
    batch_mp.branch = "Mangalvar Peth"
    batch_mp.class_code = "11-PCMB-MP"
    batch_mp.timetable = [
        {
            "day": "Monday",
            "time": clean_time,
            "room": "Hall 1",
            "subject": "Mathematics",
            "class_code": "11-PCMB-MP",
            "teacher_name": "veer 1",
            "branch": "Mangalvar Peth"
        },
        {
            "day": "Wednesday",
            "time": clean_time,
            "room": "Hall 1",
            "subject": "Mathematics",
            "class_code": "11-PCMB-MP",
            "teacher_name": "veer 1",
            "branch": "Mangalvar Peth"
        },
        {
            "day": "Friday",
            "time": clean_time,
            "room": "Hall 1",
            "subject": "Mathematics",
            "class_code": "11-PCMB-MP",
            "teacher_name": "veer 1",
            "branch": "Mangalvar Peth"
        }
    ]
    await batch_mp.save()
    print("Updated batch 11th pcmb Mangalvar Peth timetable and linked teacher.")

    # 3. Update teacher veer 1 assigned batches
    batches_list = ["11-PCMB-MP", "12-PCM-TP", "11th pcmb Mangalvar Peth", "12th pcm tarabai park"]
    teacher_veer.assigned_batches = batches_list
    teacher_veer.branch = "All Campuses"
    await teacher_veer.save()
    print("Updated teacher veer 1 assigned_batches and branch.")

    # 4. Check other batches in MongoDB with 'Mangalvar' or 'Mangalwar' in name
    all_batches = await Batch.find_all().to_list()
    for b in all_batches:
        b_name = (b.name or "").lower()
        if ("mangalvar" in b_name or "mangalwar" in b_name) and b.branch != "Mangalvar Peth":
            b.branch = "Mangalvar Peth"
            await b.save()
            print(f"Corrected branch to Mangalvar Peth for batch: {b.name} ({b.id})")

    # 5. Remove empty duplicate batch 6ad1bea2bef1fed68c7dfb71 if identical to 6ae039c448955f0b422973ce
    dup_batch = await Batch.get(ObjectId("6ad1bea2bef1fed68c7dfb71"))
    if dup_batch and dup_batch.teacher_name is None and (not dup_batch.timetable):
        await dup_batch.delete()
        print("Removed unassigned duplicate batch 6ad1bea2bef1fed68c7dfb71")

    print("Data connection successfully applied!")

if __name__ == "__main__":
    asyncio.run(main())
