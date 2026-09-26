import requests

BASE_URL = "http://127.0.0.1:8000/api"

print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin_test@test.com",
    "password": "password123"
})
token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- CREATE TEACHER ---")
teacher_data = {
    "full_name": "Exam Teacher",
    "email": "exam_teacher@test.com",
    "mobile_number": "9999999999",
    "subjects": ["Science"],
    "assigned_batches": ["Morning"],
    "hourly_rate": 50.0
}
tch_resp = requests.post(f"{BASE_URL}/teachers", json=teacher_data, headers=headers)
tch_id = tch_resp.json().get("id")

print("\n--- CREATE EXAM ---")
exam_data = {
    "exam_name": "Midterm Exam",
    "course": "Maths",
    "batch": "Morning",
    "subject": "Algebra",
    "exam_date": "2024-05-15T10:00:00Z",
    "start_time": "2024-05-15T10:00:00Z",
    "end_time": "2024-05-15T12:00:00Z",
    "max_marks": 100.0,
    "passing_marks": 40.0,
    "teacher_id": tch_id
}
ex_resp = requests.post(f"{BASE_URL}/exams", json=exam_data, headers=headers)
print("Create Exam:", ex_resp.status_code, ex_resp.text)
ex_id = ex_resp.json().get("id")

print("\n--- GET ALL EXAMS ---")
get_ex_resp = requests.get(f"{BASE_URL}/exams", headers=headers)
print("Get Exams:", get_ex_resp.status_code, get_ex_resp.text)

print("\n--- CREATE STUDENT ---")
student_data = {
    "full_name": "Exam Student",
    "email": "exam_stu@test.com",
    "mobile_number": "7777777777",
    "date_of_birth": "2010-01-01T00:00:00Z",
    "gender": "Male",
    "address": "123 Test Street",
    "parent_name": "Parent Name",
    "parent_mobile": "7777777778",
    "course": "Maths",
    "batch": "Morning",
    "academic_year": "2023-2024"
}
stu_resp = requests.post(f"{BASE_URL}/students", json=student_data, headers=headers)
stu_id = stu_resp.json().get("id")

print("\n--- SUBMIT MARKS ---")
mark_data = {
    "student_id": stu_id,
    "exam_id": ex_id,
    "marks_obtained": 85.0,
    "remarks": "Excellent"
}
mk_resp = requests.post(f"{BASE_URL}/marks", json=mark_data, headers=headers)
print("Submit Marks:", mk_resp.status_code, mk_resp.text)

print("\n--- GET STUDENT MARKS ---")
gm_resp = requests.get(f"{BASE_URL}/marks/{stu_id}", headers=headers)
print("Get Marks:", gm_resp.status_code, gm_resp.text)
