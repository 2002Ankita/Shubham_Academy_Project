import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 0. Register and Login to get a token
print("Registering test user...")
reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "admin_test@test.com",
    "password": "password123",
    "full_name": "Test Admin",
    "role": "SUPER_ADMIN"
})
print("Reg Resp:", reg_resp.status_code, reg_resp.text)

print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin_test@test.com",
    "password": "password123"
})
print("Login Resp:", login_resp.status_code, login_resp.text)

if login_resp.status_code != 200:
    print("Failed to login, exiting.")
    exit(1)

token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# TEST 1 - CREATE
print("\n--- TEST 1: CREATE ---")
student_data = {
    "full_name": "Test Student",
    "email": "student_test@test.com",
    "mobile_number": "9876543210",
    "date_of_birth": "2010-01-01T00:00:00Z",
    "gender": "Male",
    "address": "123 Test Street",
    "parent_name": "Parent Name",
    "parent_mobile": "9876543211",
    "course": "Maths",
    "batch": "Morning",
    "academic_year": "2023-2024"
}
create_resp = requests.post(f"{BASE_URL}/students", json=student_data, headers=headers)
print("Create Resp:", create_resp.status_code, create_resp.text)

if create_resp.status_code != 200:
    print("Create failed. Check error above.")
    exit(1)

student_id_db = create_resp.json().get("id")
print(f"Created student with DB ID: {student_id_db}")

# TEST 2 - READ
print("\n--- TEST 2: READ ---")
read_resp = requests.get(f"{BASE_URL}/students", headers=headers)
print("Read Resp Status:", read_resp.status_code)
students = read_resp.json()
# Check if student exists in the returned list
found = next((s for s in students if s.get("id") == student_id_db), None)
if found:
    print("Student found in DB:", found["full_name"])
else:
    print("Student NOT found in DB list!")

# TEST 3 - UPDATE
print("\n--- TEST 3: UPDATE ---")
update_data = {
    "full_name": "Test Student Updated"
}
update_resp = requests.put(f"{BASE_URL}/students/{student_id_db}", json=update_data, headers=headers)
print("Update Resp:", update_resp.status_code, update_resp.text)

read_resp2 = requests.get(f"{BASE_URL}/students", headers=headers)
found2 = next((s for s in read_resp2.json() if s.get("id") == student_id_db), None)
if found2:
    print("Updated Student Name:", found2["full_name"])

# TEST 4 - DELETE
print("\n--- TEST 4: DELETE ---")
del_resp = requests.delete(f"{BASE_URL}/students/{student_id_db}", headers=headers)
print("Delete Resp:", del_resp.status_code, del_resp.text)

read_resp3 = requests.get(f"{BASE_URL}/students", headers=headers)
found3 = next((s for s in read_resp3.json() if s.get("id") == student_id_db), None)
if found3:
    print("Student still exists after delete! ERROR")
else:
    print("Student successfully deleted.")

