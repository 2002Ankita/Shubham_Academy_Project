import asyncio
from app.core.branch_config import (
    validate_branch_batch_selection,
    parse_student_branch_batch,
    student_matches_filters,
    BRANCH_TARABAI,
    BRANCH_MANGALWAR,
    ACADEMIC_BATCHES,
    SESSIONS
)

def run_tests():
    print("Testing Branch & Batch Standardization Logic...")
    
    # 1. Tarabai Park Valid Batch
    b, ab, s = validate_branch_batch_selection(BRANCH_TARABAI, "11th PCM", None)
    assert b == BRANCH_TARABAI and ab == "11th PCM" and s is None
    print("[PASS] Tarabai Park valid batch passed")

    # 2. Tarabai Park Invalid Batch
    try:
        validate_branch_batch_selection(BRANCH_TARABAI, "Invalid Batch", None)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"[PASS] Tarabai Park invalid batch rejection passed: {e}")

    # 3. Mangalwar Peth Missing Session
    try:
        validate_branch_batch_selection(BRANCH_MANGALWAR, "11th PCM", None)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"[PASS] Mangalwar Peth missing session rejection passed: {e}")

    # 4. Mangalwar Peth Valid Morning Session
    b, ab, s = validate_branch_batch_selection(BRANCH_MANGALWAR, "11th PCM", "Morning")
    assert b == BRANCH_MANGALWAR and ab == "11th PCM" and s == "Morning"
    print("[PASS] Mangalwar Peth Morning session valid passed")

    # 5. Mangalwar Peth Valid Afternoon Session
    b, ab, s = validate_branch_batch_selection(BRANCH_MANGALWAR, "12th PCMB", "Afternoon")
    assert b == BRANCH_MANGALWAR and ab == "12th PCMB" and s == "Afternoon"
    print("[PASS] Mangalwar Peth Afternoon session valid passed")

    # 6. Legacy String Parsing
    b, ab, s, std = parse_student_branch_batch(None, "11th pcm tarabai park")
    assert b == BRANCH_TARABAI and ab == "11th PCM" and std == "11th Science"
    print(f"[PASS] Parsed legacy string '11th pcm tarabai park' -> branch={b}, academic_batch={ab}, session={s}, standard={std}")

    b, ab, s, std = parse_student_branch_batch(None, "12th pcmb Mangalvar peth")
    assert b == BRANCH_MANGALWAR and ab == "12th PCMB" and std == "12th Science"
    print(f"[PASS] Parsed legacy string '12th pcmb Mangalvar peth' -> branch={b}, academic_batch={ab}, session={s}, standard={std}")

    # 7. Filter Matching
    st_tarabai = {
        "branch": BRANCH_TARABAI,
        "academic_batch": "11th PCM",
        "session": None
    }
    assert student_matches_filters(st_tarabai, branch=BRANCH_TARABAI, academic_batch="11th PCM")
    assert not student_matches_filters(st_tarabai, branch=BRANCH_MANGALWAR)
    assert not student_matches_filters(st_tarabai, branch=BRANCH_TARABAI, academic_batch="12th PCB")

    st_mangalwar = {
        "branch": BRANCH_MANGALWAR,
        "academic_batch": "11th PCB",
        "session": "Morning"
    }
    assert student_matches_filters(st_mangalwar, branch=BRANCH_MANGALWAR, session="Morning", academic_batch="11th PCB")
    assert not student_matches_filters(st_mangalwar, branch=BRANCH_MANGALWAR, session="Afternoon")
    print("[PASS] Filtering matches verified for all branches, sessions, and batches")

    print("\nALL 7 VALIDATION AND STANDARDIZATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
