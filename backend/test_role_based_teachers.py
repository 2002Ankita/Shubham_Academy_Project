import requests

BASE_URL = "http://localhost:8000/api"

def get_token(email, password="password123"):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.status_code} {resp.text}")
        return None
    return resp.json().get("access_token")

def test_multiple_teachers():
    print("=== TESTING MULTIPLE DISTINCT TEACHER LOGINS ===")
    
    # 1. Login as Dr. Priya Kulkarni
    t1_token = get_token("priya.k@shubham.edu", "password123")
    t1_headers = {"Authorization": f"Bearer {t1_token}"}
    t1_res = requests.get(f"{BASE_URL}/teachers", headers=t1_headers).json()
    assert len(t1_res) == 1
    assert t1_res[0]["email"] == "priya.k@shubham.edu"
    print("Dr. Priya sees ONLY:", t1_res[0]["full_name"], f"({t1_res[0]['email']})")

    # 2. Login as Exam Teacher 1791350390
    t2_token = get_token("exam_teacher_1791350390@test.com", "password123")
    t2_headers = {"Authorization": f"Bearer {t2_token}"}
    t2_res = requests.get(f"{BASE_URL}/teachers", headers=t2_headers).json()
    assert len(t2_res) == 1
    assert t2_res[0]["email"] == "exam_teacher_1791350390@test.com"
    print("Exam Teacher sees ONLY:", t2_res[0]["full_name"], f"({t2_res[0]['email']})")

    # 3. Verify Exam Teacher cannot access Dr. Priya's ID
    priya_id = t1_res[0]["id"]
    forbidden_resp = requests.get(f"{BASE_URL}/teachers/{priya_id}", headers=t2_headers)
    assert forbidden_resp.status_code == 403
    print("Cross-access blocked with 403 Forbidden!")
    
    print("\nALL MULTI-TEACHER TESTS PASSED!")

if __name__ == "__main__":
    test_multiple_teachers()
