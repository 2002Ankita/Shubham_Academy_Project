import asyncio
from app.core.database import init_db
from app.models.student import Student
from app.services.student_service import get_students

async def main():
    await init_db()
    students = await get_students()
    for s in students:
        print(s)

if __name__ == "__main__":
    asyncio.run(main())
