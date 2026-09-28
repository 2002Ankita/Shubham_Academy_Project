import asyncio
from app.core.database import init_db
from app.schemas.auth import UserLogin
from app.services.auth_service import authenticate

async def main():
    await init_db()
    try:
        user_in = UserLogin(email='admin@shubham.edu', password='password123')
        token = await authenticate(user_in)
        print('Success:', token)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
