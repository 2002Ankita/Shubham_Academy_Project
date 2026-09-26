import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin_test@test.com",
    "password": "password123"
})
if login_resp.status_code != 200:
    print("Failed to login:", login_resp.text)
    exit(1)
token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- STUDENT TESTS ---")
# 1. Create a student
student_data = {
    "full_name": "Test Student 2",
    "email": "student_test2@test.com",
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
create_stu = requests.post(f"{BASE_URL}/students", json=student_data, headers=headers)
stu_id = create_stu.json().get("id")
print("Create Student:", create_stu.status_code, "ID:", stu_id)

# 2. Get student by ID
get_stu = requests.get(f"{BASE_URL}/students/{stu_id}", headers=headers)
print("Get Student:", get_stu.status_code, get_stu.json().get("full_name"))

# 3. Try non-existing ID
get_stu_non = requests.get(f"{BASE_URL}/students/6ab6174dae7a6df84a94f722", headers=headers)
print("Get Non-existing Student:", get_stu_non.status_code, get_stu_non.text)

# 4. Try invalid ID
get_stu_inv = requests.get(f"{BASE_URL}/students/invalid123", headers=headers)
print("Get Invalid Student ID:", get_stu_inv.status_code, get_stu_inv.text)


print("\n--- TEACHER TESTS ---")
# 1. Create teacher
teacher_data = {
    "full_name": "Test Teacher 1",
    "email": "teacher1@test.com",
    "mobile_number": "9998887770",
    "subjects": ["Science"],
    "assigned_batches": ["Morning"],
    "hourly_rate": 50.0
}
create_tch = requests.post(f"{BASE_URL}/teachers", json=teacher_data, headers=headers)
tch_id = create_tch.json().get("id")
print("Create Teacher:", create_tch.status_code, "ID:", tch_id)

# 2. Get teacher (Wait, there is no GET /teachers/{id} specified in instructions, but let's see if GET list works)
# Wait, actually get_teacher_by_id was added in router. Let's test it.
get_tch = requests.get(f"{BASE_URL}/teachers/{tch_id}", headers=headers)
print("Get Teacher:", get_tch.status_code, get_tch.json().get("full_name"))

# 3. Update teacher
update_data = {"full_name": "Test Teacher 1 Updated", "hourly_rate": 60.0}
update_tch = requests.put(f"{BASE_URL}/teachers/{tch_id}", json=update_data, headers=headers)
print("Update Teacher:", update_tch.status_code, update_tch.json().get("full_name"), "Rate:", update_tch.json().get("hourly_rate"))

# 4. Delete/Deactivate teacher
del_tch = requests.delete(f"{BASE_URL}/teachers/{tch_id}", headers=headers)
print("Deactivate Teacher:", del_tch.status_code, del_tch.text)

# 5. Verify behavior (Get teacher should show Inactive)
get_tch2 = requests.get(f"{BASE_URL}/teachers/{tch_id}", headers=headers)
print("Teacher Status After Deactivation:", get_tch2.json().get("status"))

