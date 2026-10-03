import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url='http://localhost:8000/api') as client:
        # 1. Login to get token (using a super admin or admin)
        # For this we need to know credentials. We can just login as an existing user.
        # Let's just do a POST and get the exact error.
        response = await client.post('/batches', json={
            'name': 'test',
            'standard': '11th',
            'subject': 'Physics',
            'student_count': 10
        })
        print("Status:", response.status_code)
        print("Body:", response.text)

asyncio.run(test())
