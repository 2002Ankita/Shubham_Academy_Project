import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db
from app.models.user import User
from app.models.teacher import Teacher
from app.models.batch import Batch
from app.models.daily_activity import DailyActivity
from app.core.security import get_password_hash

async def seed_faculty_and_schedules():
    await init_db()
    print("Database connected. Seeding faculty & schedules...")

    # 1. Teachers definition
    faculty_list = [
        {
            "name": "Dr. Priya Kulkarni",
            "email": "priya.k@shubham.edu",
            "emp_id": "EMP-TCH-01",
            "phone": "9822100001",
            "subjects": ["Physics"],
            "batches": ["12th Science Tarabai Park (Batch A)", "12th Science Tarabai Park (Batch B)", "11th Science PCM (Batch A)"]
        },
        {
            "name": "Prof. Sunita Patil",
            "email": "sunita.p@shubham.edu",
            "emp_id": "EMP-TCH-02",
            "phone": "9822100002",
            "subjects": ["Chemistry"],
            "batches": ["12th Science Tarabai Park (Batch A)", "12th Science Tarabai Park (Batch B)", "11th Science PCM (Batch B)"]
        },
        {
            "name": "Prof. Rajesh Sharma",
            "email": "rajesh.s@shubham.edu",
            "emp_id": "EMP-TCH-03",
            "phone": "9822100003",
            "subjects": ["Mathematics"],
            "batches": ["12th Science Tarabai Park (Batch A)", "12th Science Tarabai Park (Batch B)", "11th Science PCM (Batch A)"]
        },
        {
            "name": "Prof. Amit Sawant",
            "email": "amit.s@shubham.edu",
            "emp_id": "EMP-TCH-04",
            "phone": "9822100004",
            "subjects": ["Biology"],
            "batches": ["12th Science Tarabai Park (Batch A)", "11th Science PCB (Batch A)"]
        }
    ]

    teacher_docs = {}
    for f in faculty_list:
        u = await User.find_one(User.email == f["email"])
        if not u:
            u = User(
                email=f["email"],
                full_name=f["name"],
                role="teacher",
                hashed_password=get_password_hash("password123")
            )
            await u.insert()
            print(f"Created user: {f['email']}")

        t = await Teacher.find_one(Teacher.employee_id == f["emp_id"])
        if not t:
            t = Teacher(
                user=u,
                employee_id=f["emp_id"],
                mobile_number=f["phone"],
                subjects=f["subjects"],
                branch="Tarabai Park",
                assigned_batches=f["batches"],
                hourly_rate=65.0,
                status="Active"
            )
            await t.insert()
            print(f"Created teacher profile: {f['name']}")
        else:
            t.assigned_batches = f["batches"]
            t.subjects = f["subjects"]
            await t.save()

        teacher_docs[f["name"]] = t

    # 2. Comprehensive Batches with Timetable slots for each Teacher
    batches_data = [
        # PHYSICS - Dr. Priya Kulkarni
        {
            "name": "12th Science Tarabai Park (Batch A) - Physics",
            "standard": "12th Science",
            "subject": "Physics",
            "room": "Room 201",
            "time": "09:00 AM – 10:00 AM",
            "teacher_name": "Dr. Priya Kulkarni",
            "batch_name": "A",
            "class_code": "12-A",
            "days": ["Monday", "Wednesday", "Friday"],
            "timetable": [
                {"day": "Monday", "time": "09:00 AM – 10:00 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-A", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Wednesday", "time": "09:00 AM – 10:00 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-A", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Friday", "time": "09:00 AM – 10:00 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-A", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Monday", "time": "03:00 PM – 04:00 PM", "room": "Room 201", "subject": "Physics", "class_code": "12-A", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Thursday", "time": "03:00 PM – 04:00 PM", "room": "Room 201", "subject": "Physics", "class_code": "12-A", "teacher_name": "Dr. Priya Kulkarni"}
            ]
        },
        {
            "name": "12th Science Tarabai Park (Batch B) - Physics",
            "standard": "12th Science",
            "subject": "Physics",
            "room": "Room 202",
            "time": "10:00 AM – 11:00 AM",
            "teacher_name": "Dr. Priya Kulkarni",
            "batch_name": "B",
            "class_code": "12-B",
            "days": ["Monday", "Tuesday", "Thursday"],
            "timetable": [
                {"day": "Monday", "time": "10:00 AM – 11:00 AM", "room": "Room 202", "subject": "Physics", "class_code": "12-B", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Tuesday", "time": "10:00 AM – 11:00 AM", "room": "Room 202", "subject": "Physics", "class_code": "12-B", "teacher_name": "Dr. Priya Kulkarni"},
                {"day": "Thursday", "time": "10:00 AM – 11:00 AM", "room": "Room 202", "subject": "Physics", "class_code": "12-B", "teacher_name": "Dr. Priya Kulkarni"}
            ]
        },
        # CHEMISTRY - Prof. Sunita Patil
        {
            "name": "12th Science Tarabai Park (Batch A) - Chemistry",
            "standard": "12th Science",
            "subject": "Chemistry",
            "room": "Room 203",
            "time": "10:00 AM – 11:00 AM",
            "teacher_name": "Prof. Sunita Patil",
            "batch_name": "A",
            "class_code": "12-A",
            "days": ["Tuesday", "Thursday", "Saturday"],
            "timetable": [
                {"day": "Tuesday", "time": "10:00 AM – 11:00 AM", "room": "Room 203", "subject": "Chemistry", "class_code": "12-A", "teacher_name": "Prof. Sunita Patil"},
                {"day": "Thursday", "time": "10:00 AM – 11:00 AM", "room": "Room 203", "subject": "Chemistry", "class_code": "12-A", "teacher_name": "Prof. Sunita Patil"},
                {"day": "Saturday", "time": "10:00 AM – 11:00 AM", "room": "Room 203", "subject": "Chemistry", "class_code": "12-A", "teacher_name": "Prof. Sunita Patil"},
                {"day": "Wednesday", "time": "03:00 PM – 04:00 PM", "room": "Chemistry Lab 1", "subject": "Chemistry", "class_code": "12-A", "teacher_name": "Prof. Sunita Patil"}
            ]
        },
        {
            "name": "11th Science PCM (Batch B) - Chemistry",
            "standard": "11th Science",
            "subject": "Chemistry",
            "room": "Chemistry Lab 1",
            "time": "11:00 AM – 12:00 PM",
            "teacher_name": "Prof. Sunita Patil",
            "batch_name": "B",
            "class_code": "11-B",
            "days": ["Monday", "Wednesday", "Friday"],
            "timetable": [
                {"day": "Monday", "time": "11:00 AM – 12:00 PM", "room": "Chemistry Lab 1", "subject": "Chemistry", "class_code": "11-B", "teacher_name": "Prof. Sunita Patil"},
                {"day": "Wednesday", "time": "11:00 AM – 12:00 PM", "room": "Chemistry Lab 1", "subject": "Chemistry", "class_code": "11-B", "teacher_name": "Prof. Sunita Patil"},
                {"day": "Friday", "time": "11:00 AM – 12:00 PM", "room": "Chemistry Lab 1", "subject": "Chemistry", "class_code": "11-B", "teacher_name": "Prof. Sunita Patil"}
            ]
        },
        # MATHEMATICS - Prof. Rajesh Sharma
        {
            "name": "12th Science Tarabai Park (Batch A) - Mathematics",
            "standard": "12th Science",
            "subject": "Mathematics",
            "room": "Room 204",
            "time": "11:00 AM – 12:00 PM",
            "teacher_name": "Prof. Rajesh Sharma",
            "batch_name": "A",
            "class_code": "12-A",
            "days": ["Monday", "Wednesday", "Friday"],
            "timetable": [
                {"day": "Monday", "time": "11:00 AM – 12:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-A", "teacher_name": "Prof. Rajesh Sharma"},
                {"day": "Wednesday", "time": "11:00 AM – 12:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-A", "teacher_name": "Prof. Rajesh Sharma"},
                {"day": "Friday", "time": "11:00 AM – 12:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-A", "teacher_name": "Prof. Rajesh Sharma"},
                {"day": "Tuesday", "time": "03:00 PM – 04:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-A", "teacher_name": "Prof. Rajesh Sharma"}
            ]
        },
        {
            "name": "12th Science Tarabai Park (Batch B) - Mathematics",
            "standard": "12th Science",
            "subject": "Mathematics",
            "room": "Room 204",
            "time": "12:00 PM – 01:00 PM",
            "teacher_name": "Prof. Rajesh Sharma",
            "batch_name": "B",
            "class_code": "12-B",
            "days": ["Tuesday", "Thursday", "Saturday"],
            "timetable": [
                {"day": "Tuesday", "time": "12:00 PM – 01:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-B", "teacher_name": "Prof. Rajesh Sharma"},
                {"day": "Thursday", "time": "12:00 PM – 01:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-B", "teacher_name": "Prof. Rajesh Sharma"},
                {"day": "Saturday", "time": "12:00 PM – 01:00 PM", "room": "Room 204", "subject": "Mathematics", "class_code": "12-B", "teacher_name": "Prof. Rajesh Sharma"}
            ]
        },
        # BIOLOGY - Prof. Amit Sawant
        {
            "name": "12th Science Tarabai Park (Batch A) - Biology",
            "standard": "12th Science",
            "subject": "Biology",
            "room": "Biology Lab 1",
            "time": "12:00 PM – 01:00 PM",
            "teacher_name": "Prof. Amit Sawant",
            "batch_name": "A",
            "class_code": "12-A",
            "days": ["Monday", "Wednesday", "Friday"],
            "timetable": [
                {"day": "Monday", "time": "12:00 PM – 01:00 PM", "room": "Biology Lab 1", "subject": "Biology", "class_code": "12-A", "teacher_name": "Prof. Amit Sawant"},
                {"day": "Wednesday", "time": "12:00 PM – 01:00 PM", "room": "Biology Lab 1", "subject": "Biology", "class_code": "12-A", "teacher_name": "Prof. Amit Sawant"},
                {"day": "Friday", "time": "12:00 PM – 01:00 PM", "room": "Biology Lab 1", "subject": "Biology", "class_code": "12-A", "teacher_name": "Prof. Amit Sawant"},
                {"day": "Friday", "time": "03:00 PM – 04:00 PM", "room": "Biology Lab 1", "subject": "Biology", "class_code": "12-A", "teacher_name": "Prof. Amit Sawant"}
            ]
        }
    ]

    for bd in batches_data:
        existing = await Batch.find_one(Batch.name == bd["name"])
        t_doc = teacher_docs.get(bd["teacher_name"])
        if not existing:
            new_batch = Batch(
                name=bd["name"],
                standard=bd["standard"],
                subject=bd["subject"],
                room=bd["room"],
                time=bd["time"],
                student_count=24,
                teacher_name=bd["teacher_name"],
                teacher=t_doc,
                batch_name=bd["batch_name"],
                class_code=bd["class_code"],
                days=bd["days"],
                timetable=bd["timetable"],
                academic_year="2025-2026",
                branch="Tarabai Park",
                status="Active"
            )
            await new_batch.insert()
            print(f"Created batch & timetable: {bd['name']}")
        else:
            existing.timetable = bd["timetable"]
            existing.teacher_name = bd["teacher_name"]
            existing.teacher = t_doc
            await existing.save()
            print(f"Updated timetable for: {bd['name']}")

    # 3. Seed activities for each teacher
    activities_seed = [
        {
            "activity": "Classroom Lecture & Theory",
            "subject": "Physics",
            "batch": "12th Science Tarabai Park (Batch A)",
            "topic_taught": "Ray Optics - Spherical Mirrors & Snell's Law",
            "time_slot": "03:00 PM - 04:00 PM",
            "hours": 1.0,
            "periods": 1,
            "total_planned_periods": 2,
            "status": "Completed",
            "teacher_name": "Dr. Priya Kulkarni",
            "remarks": "Completed derivations and homework assigned."
        },
        {
            "activity": "Classroom Lecture & Theory",
            "subject": "Physics",
            "batch": "12th Science Tarabai Park (Batch A)",
            "topic_taught": "Wave Optics - Wavefronts & Interference",
            "time_slot": "03:00 PM - 04:00 PM",
            "hours": 1.0,
            "periods": 1,
            "total_planned_periods": 2,
            "status": "In Progress",
            "teacher_name": "Dr. Priya Kulkarni",
            "remarks": "Slit interference numerical problems solved."
        },
        {
            "activity": "Classroom Lecture & Theory",
            "subject": "Chemistry",
            "batch": "12th Science Tarabai Park (Batch A)",
            "topic_taught": "Chemical Kinetics - Rate Laws & Order of Reaction",
            "time_slot": "10:00 AM - 11:00 AM",
            "hours": 1.0,
            "periods": 1,
            "total_planned_periods": 2,
            "status": "Completed",
            "teacher_name": "Prof. Sunita Patil",
            "remarks": "Solved integrated rate law numericals."
        },
        {
            "activity": "Practical Lab Session",
            "subject": "Chemistry",
            "batch": "11th Science PCM (Batch B)",
            "topic_taught": "Volumetric Analysis - Titration of KMnO4 vs Oxalic Acid",
            "time_slot": "11:00 AM - 12:30 PM",
            "hours": 1.5,
            "periods": 2,
            "total_planned_periods": 2,
            "status": "Completed",
            "teacher_name": "Prof. Sunita Patil",
            "remarks": "Checked student lab records and burette readings."
        },
        {
            "activity": "Classroom Lecture & Theory",
            "subject": "Mathematics",
            "batch": "12th Science Tarabai Park (Batch A)",
            "topic_taught": "Definite Integration - Fundamental Theorem of Calculus",
            "time_slot": "11:00 AM - 12:00 PM",
            "hours": 1.0,
            "periods": 1,
            "total_planned_periods": 3,
            "status": "Completed",
            "teacher_name": "Prof. Rajesh Sharma",
            "remarks": "Solved Board exercise 4.2 numericals."
        },
        {
            "activity": "Classroom Lecture & Theory",
            "subject": "Biology",
            "batch": "12th Science Tarabai Park (Batch A)",
            "topic_taught": "Molecular Basis of Inheritance - DNA Replication Machinery",
            "time_slot": "12:00 PM - 01:00 PM",
            "hours": 1.0,
            "periods": 1,
            "total_planned_periods": 2,
            "status": "Completed",
            "teacher_name": "Prof. Amit Sawant",
            "remarks": "Diagrams drawn on chalkboard, quiz conducted."
        }
    ]

    for act in activities_seed:
        exists = await DailyActivity.find_one({
            "subject": act["subject"],
            "topic_taught": act["topic_taught"],
            "teacher_name": act["teacher_name"]
        })
        if not exists:
            da = DailyActivity(**act)
            await da.insert()
            print(f"Created daily activity for {act['teacher_name']}: {act['topic_taught']}")

    print("All faculty & timetable schedules successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_faculty_and_schedules())
