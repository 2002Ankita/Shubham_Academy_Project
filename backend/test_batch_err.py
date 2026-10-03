import asyncio
import httpx
from pymongo import MongoClient

async def test():
    import sys
    sys.path.append('.')
    from app.core.security import create_access_token
    from app.core.database import init_db
    from app.models.user import User
    
    await init_db()
    user = await User.find_one()
    token = create_access_token(user.email)
    
    async with httpx.AsyncClient(base_url='http://localhost:8000/api') as client:
        response = await client.post('/batches', json={
            'name': 'test3',
            'standard': '11th',
            'subject': 'Physics',
            'student_count': 10,
            'teacher_name': 'veer1'
        }, headers={'Authorization': f'Bearer {token}'})
        
        print("Status:", response.status_code)
        
        # Now let's try to capture the 500 stack trace by running FastAPI test client
        from fastapi.testclient import TestClient
        from app.main import app
        
        client = TestClient(app)
        try:
            res = client.post('/api/batches', json={
                'name': 'test4',
                'standard': '11th',
                'subject': 'Physics',
                'student_count': 10,
                'teacher_name': 'veer1'
            }, headers={'Authorization': f'Bearer {token}'})
            print("TestClient Status:", res.status_code)
            print("TestClient Body:", res.text)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test())
