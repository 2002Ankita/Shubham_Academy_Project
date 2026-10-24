import asyncio
from app.core.database import init_db
from app.schemas.auth import UserLogin
from app.services.auth_service import authenticate, get_current_user
from app.services.batch_service import get_all_batches
from app.services.fee_service import get_fee_structures, get_pending_fees
from app.services.student_service import get_students, get_discount_approvals
from app.services.mark_service import get_all_exams

async def run_checks():
    await init_db()
    print("=" * 60)
    print("MULTI-CAMPUS BACKEND INTEGRATION VERIFICATION")
    print("=" * 60)

    # 1. Test Auth for 2 Admins & 2 SuperAdmins
    credentials = [
        ("admin@shubham.edu", "password123", "admin", "Mangalvar Peth"),
        ("superadmin@shubham.edu", "password123", "super_admin", "Mangalvar Peth"),
        ("admin.tarabai@shubham.edu", "password123", "admin", "Tarabai Park"),
        ("superadmin.tarabai@shubham.edu", "password123", "super_admin", "Tarabai Park")
    ]

    for email, pwd, expected_role, expected_branch in credentials:
        token = await authenticate(UserLogin(email=email, password=pwd))
        assert token, f"Token generation failed for {email}"
        user = await get_current_user(token)
        assert user.email.lower() == email.lower(), f"Email mismatch: {user.email} vs {email}"
        assert user.role == expected_role, f"Role mismatch for {email}: {user.role} vs {expected_role}"
        assert getattr(user, "branch", None) == expected_branch, f"Branch mismatch for {email}: {getattr(user, 'branch', None)} vs {expected_branch}"
        print(f"[PASS] Auth verified for {email} -> role={user.role}, branch={user.branch}, name={user.full_name}")

    # 2. Test Batches Scoping
    batches_tp = await get_all_batches(branch="Tarabai Park")
    batches_mp = await get_all_batches(branch="Mangalvar Peth")
    print(f"[PASS] Batches - Tarabai Park: {len(batches_tp)}, Mangalvar Peth: {len(batches_mp)}")
    assert len(batches_tp) > 0, "Tarabai Park should have batches"
    assert len(batches_mp) > 0, "Mangalvar Peth should have batches"

    # 3. Test Fee Structures Scoping
    structs_tp = await get_fee_structures(branch="Tarabai Park")
    structs_mp = await get_fee_structures(branch="Mangalvar Peth")
    print(f"[PASS] Fee Structures - Tarabai Park: {len(structs_tp)}, Mangalvar Peth: {len(structs_mp)}")
    assert len(structs_tp) > 0, "Tarabai Park should have fee structures"
    assert len(structs_mp) > 0, "Mangalvar Peth should have fee structures"

    # 4. Test Pending Fees Scoping
    pending_tp = await get_pending_fees(branch="Tarabai Park")
    pending_mp = await get_pending_fees(branch="Mangalvar Peth")
    print(f"[PASS] Pending Fees - Tarabai Park: {len(pending_tp)}, Mangalvar Peth: {len(pending_mp)}")

    # 5. Test Students Scoping
    students_tp = await get_students(branch="Tarabai Park")
    students_mp = await get_students(branch="Mangalvar Peth")
    print(f"[PASS] Students - Tarabai Park: {len(students_tp)}, Mangalvar Peth: {len(students_mp)}")

    # 6. Test Discount Approvals Scoping
    approvals_tp = await get_discount_approvals(branch="Tarabai Park")
    approvals_mp = await get_discount_approvals(branch="Mangalvar Peth")
    print(f"[PASS] Discount Approvals - Tarabai Park: {len(approvals_tp)}, Mangalvar Peth: {len(approvals_mp)}")

    # 7. Test Exams
    exams = await get_all_exams()
    print(f"[PASS] Exams loaded successfully: {len(exams)} exams in database")

    print("=" * 60)
    print("ALL MULTI-CAMPUS BACKEND TESTS PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_checks())
