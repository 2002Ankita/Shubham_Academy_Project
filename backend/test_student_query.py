import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.student_service import get_students, normalize_all_students
from app.core.database import init_db

async def main():
    await init_db()
    await normalize_all_students()
    all_students = await get_students()
    print(f"Total students: {len(all_students)}")
    for s in all_students:
        print(f"[{s.get('student_id')}] {s.get('full_name')} => Branch: '{s.get('branch')}', Academic Batch: '{s.get('academic_batch')}', Session: '{s.get('session')}'")

    print("\n--- Testing Tarabai Park Filter ---")
    tp_students = await get_students(branch="Tarabai Park")
    print(f"Tarabai Park students: {len(tp_students)}")

    print("\n--- Testing Mangalwar Peth Filter ---")
    mp_students = await get_students(branch="Mangalwar Peth")
    print(f"Mangalwar Peth students: {len(mp_students)}")

    print("\n--- Testing Tarabai Park + 11th PCM Filter ---")
    tp_pcm = await get_students(branch="Tarabai Park", academic_batch="11th PCM")
    print(f"Tarabai Park 11th PCM students: {len(tp_pcm)}")

if __name__ == "__main__":
    asyncio.run(main())
