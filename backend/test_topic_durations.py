import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("Testing Topic Durations API...")

    # 1. Test GET list
    try:
        get_res = requests.get(f"{BASE_URL}/topic-durations")
        print("GET /topic-durations status:", get_res.status_code)
        if get_res.status_code == 200:
            topics = get_res.json()
            print(f"Total topics retrieved: {len(topics)}")
            if len(topics) > 0:
                print("First topic sample:", topics[0].get("topic_name"), "| Teacher:", topics[0].get("teacher_name"))
        else:
            print("GET failed:", get_res.text)
    except Exception as e:
        print("Could not connect to backend server:", e)
        return

    # 2. Test POST create
    test_topic = {
        "standard": "Class 12th",
        "branch": "Tarabai Park",
        "batch": "12th Science Tarabai Park (Batch A)",
        "subject": "Physics (Class 12th)",
        "teacher_name": "More A.D",
        "chapter": "Chapter 7: Wave Optics",
        "topic_name": f"Test Interference Derivation {int(time.time())}",
        "required_periods": 4,
        "period_duration_mins": 45,
        "completed_periods": 1,
        "target_date": "2026-10-28",
        "status": "In Progress",
        "remarks": "Test plan verification"
    }
    create_res = requests.post(f"{BASE_URL}/topic-durations", json=test_topic)
    print("POST /topic-durations status:", create_res.status_code)
    if create_res.status_code != 200:
        print("POST failed:", create_res.text)
        return

    created = create_res.json()
    created_id = created.get("id")
    topic_id = created.get("topic_id")
    print(f"Created topic successfully! DB ID: {created_id}, topic_id: {topic_id}")

    # 3. Test GET by ObjectId and by topic_id
    get_by_id = requests.get(f"{BASE_URL}/topic-durations/{created_id}")
    print("GET by ObjectId status:", get_by_id.status_code)

    get_by_topic_id = requests.get(f"{BASE_URL}/topic-durations/{topic_id}")
    print("GET by topic_id string status:", get_by_topic_id.status_code)

    # 4. Test PUT update
    update_data = {
        "completed_periods": 3,
        "status": "In Progress",
        "remarks": "Updated successfully"
    }
    put_res = requests.put(f"{BASE_URL}/topic-durations/{created_id}", json=update_data)
    print("PUT /topic-durations/{id} status:", put_res.status_code)
    if put_res.status_code == 200:
        print("Updated periods:", put_res.json().get("completed_periods"))

    # 5. Test DELETE
    del_res = requests.delete(f"{BASE_URL}/topic-durations/{created_id}")
    print("DELETE /topic-durations/{id} status:", del_res.status_code)
    print("All Topic Duration tests completed!")

if __name__ == "__main__":
    run_tests()
