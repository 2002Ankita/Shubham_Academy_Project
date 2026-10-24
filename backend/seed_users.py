import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password

async def seed():
    await init_db()
    
    users = [
        # Mangalvar Peth Admins
        {"email": "superadmin@shubham.edu", "full_name": "Shubham Sharma", "role": "super_admin", "branch": "Mangalvar Peth", "password": "password123"},
        {"email": "admin@shubham.edu", "full_name": "Rajesh Patil", "role": "admin", "branch": "Mangalvar Peth", "password": "password123"},
        # Tarabai Park Admins
        {"email": "superadmin.tarabai@shubham.edu", "full_name": "Sanjay Shinde", "role": "super_admin", "branch": "Tarabai Park", "password": "password123"},
        {"email": "admin.tarabai@shubham.edu", "full_name": "Vikram Desai", "role": "admin", "branch": "Tarabai Park", "password": "password123"},
        # Faculty & Student Defaults
        {"email": "priya.k@shubham.edu", "full_name": "Dr. Priya Kulkarni", "role": "teacher", "branch": "Tarabai Park", "password": "password123"},
        {"email": "aarav.d@shubham.edu", "full_name": "Aarav Deshmukh", "role": "student", "branch": "Tarabai Park", "password": "9876500001"}
    ]
    
    for u in users:
        exists = await User.find_one(User.email == u["email"])
        if not exists:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                branch=u["branch"],
                hashed_password=get_password_hash(u.get("password", "password123")),
                is_active=True
            )
            await user.insert()
            print(f"Created {u['email']} (branch={u['branch']})")
        else:
            updated = False
            if getattr(exists, "branch", None) != u["branch"]:
                exists.branch = u["branch"]
                updated = True
            if getattr(exists, "role", None) != u["role"]:
                exists.role = u["role"]
                updated = True
            if not getattr(exists, "is_active", True):
                exists.is_active = True
                updated = True
            if not verify_password(u.get("password", "password123"), exists.hashed_password):
                exists.hashed_password = get_password_hash(u.get("password", "password123"))
                updated = True
            if updated:
                await exists.save()
                print(f"Updated {u['email']} (branch={u['branch']})")
            else:
                print(f"{u['email']} is already up to date")
    print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
