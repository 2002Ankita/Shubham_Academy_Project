import requests

login = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'teacher1@test.com', 'password': 'password123'})
token = login.json().get('access_token')

payload = {
    'date': '2026-10-03T00:00:00Z',
    'status': 'Present'
}
res = requests.post('http://127.0.0.1:8000/api/attendance/check-out', json=payload, headers={'Authorization': 'Bearer '+token})
print("Check Out:", res.status_code, res.text)
