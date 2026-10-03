import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.student_service import get_students
from app.core.database import init_db

async def main():
    await init_db()
    students = await get_students()
    for s in students:
        print(f"Student: {s.get('full_name')} - {s.get('email')}")
    print(f"Got {len(students)} students")

if __name__ == "__main__":
    asyncio.run(main())
