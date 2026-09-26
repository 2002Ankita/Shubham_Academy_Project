import requests

BASE_URL = "http://127.0.0.1:8000/api"

print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin_test@test.com",
    "password": "password123"
})
token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- CREATE FEE STRUCTURE ---")
structure_data = {
    "course": "Maths",
    "batch": "Morning",
    "academic_year": "2023-2024",
    "total_fee": 50000.0,
    "installment_amount": 10000.0,
    "number_of_installments": 5,
    "due_date": "2024-12-31T23:59:59Z",
    "late_fee": 500.0
}
s_resp = requests.post(f"{BASE_URL}/fees/structures", json=structure_data, headers=headers)
print("Create Structure:", s_resp.status_code, s_resp.text)

print("\n--- CREATE STUDENT ---")
student_data = {
    "full_name": "Fee Student",
    "email": "fee_stu@test.com",
    "mobile_number": "8888888888",
    "date_of_birth": "2010-01-01T00:00:00Z",
    "gender": "Male",
    "address": "123 Test Street",
    "parent_name": "Parent Name",
    "parent_mobile": "8888888889",
    "course": "Maths",
    "batch": "Morning",
    "academic_year": "2023-2024"
}
stu_resp = requests.post(f"{BASE_URL}/students", json=student_data, headers=headers)
stu_id = stu_resp.json().get("id")
print("Student ID:", stu_id)

print("\n--- ADD FEE PAYMENT ---")
pay_data = {
    "student_id": stu_id,
    "amount_paid": 20000.0,
    "payment_method": "UPI",
    "transaction_reference": "TXN12345",
    "remarks": "First two installments"
}
p_resp = requests.post(f"{BASE_URL}/fees", json=pay_data, headers=headers)
print("Payment Resp:", p_resp.status_code, p_resp.text)

print("\n--- GET STUDENT FEE DETAILS ---")
fd_resp = requests.get(f"{BASE_URL}/fees/{stu_id}", headers=headers)
print("Fee Details:", fd_resp.status_code, fd_resp.text)

print("\n--- GET PENDING FEES ---")
pf_resp = requests.get(f"{BASE_URL}/fees/pending", headers=headers)
print("Pending Fees:", pf_resp.status_code, pf_resp.text)

print("\n--- GET GLOBAL FEES LIST ---")
gf_resp = requests.get(f"{BASE_URL}/fees", headers=headers)
print("Global Fees:", gf_resp.status_code, gf_resp.text)
