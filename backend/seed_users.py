import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db
from app.models.user import User
from app.core.security import get_password_hash

async def seed():
    await init_db()
    
    users = [
        {"email": "superadmin@shubham.edu", "full_name": "Shubham Sharma", "role": "super_admin", "password": "password123"},
        {"email": "admin@shubham.edu", "full_name": "Rajesh Patil", "role": "admin", "password": "password123"},
        {"email": "priya.k@shubham.edu", "full_name": "Dr. Priya Kulkarni", "role": "teacher", "password": "password123"},
        {"email": "aarav.d@shubham.edu", "full_name": "Aarav Deshmukh", "role": "student", "password": "9876500001"}
    ]
    
    for u in users:
        exists = await User.find_one(User.email == u["email"])
        if not exists:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=get_password_hash(u.get("password", "password123"))
            )
            await user.insert()
            print(f"Created {u['email']}")
        else:
            print(f"{u['email']} already exists")
    print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
