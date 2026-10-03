import requests
import json

# Login as teacher
login = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'teacher1@test.com', 'password': 'password123'})
token = login.json().get('access_token')

if not token:
    print("Login failed:", login.text)
    exit()

me = requests.get('http://127.0.0.1:8000/api/auth/me', headers={'Authorization': 'Bearer '+token})
user_id = me.json().get('id')
print("User ID:", user_id)

payload = {
    'teacher_id': user_id,
    'date': '2026-10-03T00:00:00Z',
    'status': 'Present'
}
res = requests.post('http://127.0.0.1:8000/api/attendance/check-in', json=payload, headers={'Authorization': 'Bearer '+token})
print("Check In:", res.status_code, res.text)
