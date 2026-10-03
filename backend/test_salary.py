import requests

login = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'teacher1@test.com', 'password': 'password123'})
token = login.json().get('access_token')

res = requests.get('http://127.0.0.1:8000/api/salary/me', headers={'Authorization': 'Bearer '+token})
print("My Salaries:", res.status_code, res.text)
