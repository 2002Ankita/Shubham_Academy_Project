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
    if not user:
        print("No users found")
        return
        
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
        print("Body:", response.text)

asyncio.run(test())
