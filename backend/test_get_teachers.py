import asyncio
from app.models.teacher import Teacher
from app.models.user import User
from app.core.database import init_db

async def main():
    await init_db()
    
    teachers = await Teacher.find_all(fetch_links=True).to_list()
    print("Teachers with fetch_links=True:")
    for t in teachers:
        if isinstance(t.user, User):
            print(f"Teacher {t.id} - Name: {t.user.full_name}, Email: {t.user.email}")
        else:
            print(f"Teacher {t.id} - User is not fetched. It is {type(t.user)}")

if __name__ == "__main__":
    asyncio.run(main())
