import asyncio
from app.core.database import init_db
from app.schemas.auth import UserLogin
from app.services.auth_service import authenticate, get_current_user

async def main():
    await init_db()
    test_accounts = [
        ("admin@shubham.edu", "password123"),
        ("superadmin@shubham.edu", "password123"),
        ("admin.tarabai@shubham.edu", "password123"),
        ("superadmin.tarabai@shubham.edu", "password123"),
    ]
    for email, pwd in test_accounts:
        try:
            token = await authenticate(UserLogin(email=email, password=pwd))
            user = await get_current_user(token)
            print(f"[SUCCESS] {email} -> Token generated! User: full_name='{user.full_name}', role='{user.role}', branch='{getattr(user, 'branch', None)}'")
        except Exception as e:
            print(f"[FAIL] {email} -> {e}")

if __name__ == "__main__":
    asyncio.run(main())
