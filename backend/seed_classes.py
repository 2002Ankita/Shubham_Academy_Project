import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db
from app.models.batch import Batch
from app.models.teacher import Teacher
from app.models.user import User
from app.models.student import Student
from datetime import datetime

async def seed():
    await init_db()
    
    # 1. Find Dr. Priya Kulkarni
    priya_user = await User.find_one(User.email == "priya.k@shubham.edu")
    if not priya_user:
        print("Priya user not found, please run seed_users.py first")
        return
        
    priya_teacher = await Teacher.find_one({"user.$id": priya_user.id})
    if not priya_teacher:
        priya_teacher = await Teacher.find_one(Teacher.employee_id == f"EMP-SEED-{str(priya_user.id)}")
    
    # Clear existing batches to ensure clean state
    await Batch.find_all().delete()
    print("Cleared existing batches")
    
    # 2. Define the 3 assigned classes exactly as in reference screenshot
    batch1 = Batch(
        name="11th Science",
        standard="11th Science",
        subject="Physics",
        batch_name="A",
        class_code="11-A",
        student_count=42,
        room="Room 201",
        time="09:00 AM – 10:00 AM",
        teacher_name="Dr. Priya Kulkarni",
        days=["Monday", "Wednesday", "Thursday"],
        timetable=[
            {"day": "Monday", "time": "09:00 AM – 10:00 AM", "room": "201", "class_code": "11-A", "subject": "Physics"},
            {"day": "Wednesday", "time": "11:00 AM – 12:00 PM", "room": "201", "class_code": "11-A", "subject": "Mathematics"},
            {"day": "Thursday", "time": "09:00 AM – 10:00 AM", "room": "201", "class_code": "11-A", "subject": "Physics"}
        ]
    )
    await batch1.insert()
    
    batch2 = Batch(
        name="12th Science",
        standard="12th Science",
        subject="Physics",
        batch_name="B",
        class_code="12-B",
        student_count=38,
        room="Room 305",
        time="11:30 AM – 12:30 PM",
        teacher_name="Dr. Priya Kulkarni",
        days=["Monday", "Wednesday", "Thursday"],
        timetable=[
            {"day": "Monday", "time": "11:00 AM – 12:00 PM", "room": "305", "class_code": "12-B", "subject": "Physics"},
            {"day": "Wednesday", "time": "09:00 AM – 10:00 AM", "room": "305", "class_code": "12-B", "subject": "Physics"},
            {"day": "Thursday", "time": "10:00 AM – 11:00 AM", "room": "305", "class_code": "12-B", "subject": "Mathematics"},
            {"day": "Tuesday", "time": "10:00 AM – 11:00 AM", "room": "201", "class_code": "12-A", "subject": "Mathematics"},
            {"day": "Wednesday", "time": "12:00 PM – 01:00 PM", "room": "305", "class_code": "12-A", "subject": "Physics"},
            {"day": "Friday", "time": "11:00 AM – 12:00 PM", "room": "201", "class_code": "12-A", "subject": "Mathematics"}
        ]
    )
    await batch2.insert()
    
    batch3 = Batch(
        name="11th Science",
        standard="11th Science",
        subject="Mathematics",
        batch_name="B",
        class_code="11-B",
        student_count=40,
        room="Room 202",
        time="02:00 PM – 03:00 PM",
        teacher_name="Dr. Priya Kulkarni",
        days=["Tuesday", "Thursday", "Friday"],
        timetable=[
            {"day": "Tuesday", "time": "12:00 PM – 01:00 PM", "room": "202", "class_code": "11-B", "subject": "Maths"},
            {"day": "Thursday", "time": "12:00 PM – 01:00 PM", "room": "202", "class_code": "11-B", "subject": "Physics"},
            {"day": "Friday", "time": "10:00 AM – 11:00 AM", "room": "202", "class_code": "11-B", "subject": "Physics"}
        ]
    )
    await batch3.insert()
    
    # Update teacher assigned batches
    if priya_teacher:
        priya_teacher.assigned_batches = ["11th Science - Batch A", "12th Science - Batch B", "11th Science - Batch B"]
        priya_teacher.subjects = ["Physics", "Mathematics"]
        await priya_teacher.save()
        print("Updated Dr. Priya Kulkarni assigned_batches")
        
    # Check if student Aarav Deshmukh is linked to 11th Science Batch A
    aarav_user = await User.find_one(User.email == "aarav.d@shubham.edu")
    if aarav_user:
        aarav_student = await Student.find_one({"user.$id": aarav_user.id})
        if not aarav_student:
            aarav_student = Student(
                user=aarav_user,
                student_id="STU-1001",
                mobile_number="9876500001",
                date_of_birth=datetime(2009, 5, 12),
                gender="Male",
                address="Shivaji Park, Kolhapur",
                parent_name="Sanjay Deshmukh",
                parent_mobile="9876500002",
                standard="11th Science",
                batch="Batch A",
                branch="Tarabai Park",
                academic_year="2026-2027"
            )
            await aarav_student.insert()
        else:
            aarav_student.standard = "11th Science"
            aarav_student.batch = "Batch A"
            await aarav_student.save()
            
    print("Seed complete! 3 Batches created for Dr. Priya Kulkarni.")

if __name__ == "__main__":
    asyncio.run(seed())
