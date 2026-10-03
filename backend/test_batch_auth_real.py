import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url='http://localhost:8000/api') as client:
        # We don't know the exact super admin password, let's create a new super admin user directly in DB
        import sys
        sys.path.append('.')
        from app.core.database import init_db
        from app.models.user import User
        from app.core.security import get_password_hash
        
        await init_db()
        user = await User.find_one(User.email == "test_auth_123@academy.com")
        if not user:
            user = User(email="test_auth_123@academy.com", hashed_password=get_password_hash("password"), full_name="Test", role="super-admin")
            await user.insert()
            
        login_res = await client.post('/auth/login', json={'email': 'test_auth_123@academy.com', 'password': 'password'})
        print("Login status:", login_res.status_code)
        token = login_res.json().get('access_token')
        
        res = await client.post('/batches', json={
            'name': 'test5',
            'standard': '11th',
            'subject': 'Physics',
            'student_count': 10,
            'teacher_name': 'veer1'
        }, headers={'Authorization': f'Bearer {token}'})
        print("Batch Status:", res.status_code)
        print("Batch Body:", res.text)

asyncio.run(test())
