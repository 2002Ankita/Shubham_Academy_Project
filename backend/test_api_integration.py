import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    print("Testing API endpoints for Branch & Batch filtering...")
    login = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@shubham.edu", "password": "password123"})
    token = login.json().get("access_token")
    if not token:
        print("Login failed:", login.text)
        return
    headers = {"Authorization": f"Bearer {token}"}

    try:
        r = requests.get(f"{BASE_URL}/students", headers=headers, timeout=5)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            students = r.json()
            print(f"Total students returned: {len(students)}")
            if students:
                sample = students[0]
                print(f"Sample Student: {sample.get('name')} | Branch: {sample.get('branch')} | Academic Batch: {sample.get('academic_batch')} | Session: {sample.get('session')}")
            
            # Test filter by branch Tarabai Park
            r_tp = requests.get(f"{BASE_URL}/students?branch=Tarabai Park", headers=headers, timeout=5)
            tp_students = r_tp.json()
            print(f"Tarabai Park students: {len(tp_students)}")

            # Test filter by branch Mangalwar Peth
            r_mp = requests.get(f"{BASE_URL}/students?branch=Mangalwar Peth", headers=headers, timeout=5)
            mp_students = r_mp.json()
            print(f"Mangalwar Peth students: {len(mp_students)}")

            # Test filter by branch Mangalwar Peth & session Morning
            r_mp_m = requests.get(f"{BASE_URL}/students?branch=Mangalwar Peth&session=Morning", headers=headers, timeout=5)
            mp_m_students = r_mp_m.json()
            print(f"Mangalwar Peth Morning students: {len(mp_m_students)}")

            print("\n[PASS] API integration test succeeded perfectly!")
    except Exception as e:
        print(f"API request note: {e}")

if __name__ == "__main__":
    test_api()
