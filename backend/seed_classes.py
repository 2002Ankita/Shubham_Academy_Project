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
    
    # 2. Define the 12 academy batches
    new_batches = [
        Batch(
            name="11th pcm tarabai park",
            standard="11th Science",
            subject="Physics, Chemistry, Mathematics",
            room="Room 101 (Tarabai Park)",
            time="08:00 AM – 10:30 AM",
            teacher_name="Dr. Priya Kulkarni",
            batch_name="11-PCM-TP",
            class_code="11-PCM-TP",
            branch="Tarabai Park",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="11th pcb tarabai park",
            standard="11th Science",
            subject="Physics, Chemistry, Biology",
            room="Room 102 (Tarabai Park)",
            time="10:30 AM – 01:00 PM",
            teacher_name="Dr. Priya Kulkarni",
            batch_name="11-PCB-TP",
            class_code="11-PCB-TP",
            branch="Tarabai Park",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="11th pcmb tarabai park",
            standard="11th Science",
            subject="Physics, Chemistry, Maths, Biology",
            room="Room 103 (Tarabai Park)",
            time="01:30 PM – 04:30 PM",
            teacher_name="Dr. Priya Kulkarni",
            batch_name="11-PCMB-TP",
            class_code="11-PCMB-TP",
            branch="Tarabai Park",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="12th pcm tarabai park",
            standard="12th Science",
            subject="Physics, Chemistry, Mathematics",
            room="Room 201 (Tarabai Park)",
            time="08:00 AM – 10:30 AM",
            teacher_name="Prof. Rajesh Sharma",
            batch_name="12-PCM-TP",
            class_code="12-PCM-TP",
            branch="Tarabai Park",
            days=["Tuesday", "Thursday", "Saturday"]
        ),
        Batch(
            name="12th pcb tarabai park",
            standard="12th Science",
            subject="Physics, Chemistry, Biology",
            room="Room 202 (Tarabai Park)",
            time="10:30 AM – 01:00 PM",
            teacher_name="Prof. Sunita Patil",
            batch_name="12-PCB-TP",
            class_code="12-PCB-TP",
            branch="Tarabai Park",
            days=["Tuesday", "Thursday", "Saturday"]
        ),
        Batch(
            name="12th pcmb tarabai park",
            standard="12th Science",
            subject="Physics, Chemistry, Maths, Biology",
            room="Room 203 (Tarabai Park)",
            time="01:30 PM – 04:30 PM",
            teacher_name="Prof. Rajesh Sharma",
            batch_name="12-PCMB-TP",
            class_code="12-PCMB-TP",
            branch="Tarabai Park",
            days=["Tuesday", "Thursday", "Saturday"]
        ),
        Batch(
            name="11th pcm Mangalvar Peth",
            standard="11th Science",
            subject="Physics, Chemistry, Mathematics",
            room="Hall 1 (Mangalvar Peth)",
            time="08:00 AM – 10:30 AM",
            teacher_name="Dr. Priya Kulkarni",
            batch_name="11-PCM-MP",
            class_code="11-PCM-MP",
            branch="Mangalvar Peth",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="11th pcb Mangalvar Peth",
            standard="11th Science",
            subject="Physics, Chemistry, Biology",
            room="Hall 2 (Mangalvar Peth)",
            time="10:30 AM – 01:00 PM",
            teacher_name="Prof. Sunita Patil",
            batch_name="11-PCB-MP",
            class_code="11-PCB-MP",
            branch="Mangalvar Peth",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="11th pcmb Mangalvar Peth",
            standard="11th Science",
            subject="Physics, Chemistry, Maths, Biology",
            room="Hall 3 (Mangalvar Peth)",
            time="01:30 PM – 04:30 PM",
            teacher_name="Prof. Rajesh Sharma",
            batch_name="11-PCMB-MP",
            class_code="11-PCMB-MP",
            branch="Mangalvar Peth",
            days=["Monday", "Wednesday", "Friday"]
        ),
        Batch(
            name="12th pcm Mangalvar Peth",
            standard="12th Science",
            subject="Physics, Chemistry, Mathematics",
            room="Hall 1 (Mangalvar Peth)",
            time="08:00 AM – 10:30 AM",
            teacher_name="Prof. Rajesh Sharma",
            batch_name="12-PCM-MP",
            class_code="12-PCM-MP",
            branch="Mangalvar Peth",
            days=["Tuesday", "Thursday", "Saturday"]
        ),
        Batch(
            name="12th pcb Mangalvar Peth",
            standard="12th Science",
            subject="Physics, Chemistry, Biology",
            room="Hall 2 (Mangalvar Peth)",
            time="10:30 AM – 01:00 PM",
            teacher_name="Prof. Sunita Patil",
            batch_name="12-PCB-MP",
            class_code="12-PCB-MP",
            branch="Mangalvar Peth",
            days=["Tuesday", "Thursday", "Saturday"]
        ),
        Batch(
            name="12th pcmb Mangalvar Peth",
            standard="12th Science",
            subject="Physics, Chemistry, Maths, Biology",
            room="Hall 3 (Mangalvar Peth)",
            time="01:30 PM – 04:30 PM",
            teacher_name="Dr. Priya Kulkarni",
            batch_name="12-PCMB-MP",
            class_code="12-PCMB-MP",
            branch="Mangalvar Peth",
            days=["Tuesday", "Thursday", "Saturday"]
        )
    ]
    for b in new_batches:
        await b.insert()

    # Update teacher assigned batches
    if priya_teacher:
        priya_teacher.assigned_batches = [
            "11th pcm tarabai park",
            "11th pcb tarabai park",
            "11th pcmb tarabai park",
            "11th pcm Mangalvar Peth",
            "12th pcmb Mangalvar Peth"
        ]
        priya_teacher.subjects = ["Physics", "Mathematics"]
        await priya_teacher.save()
        print("Updated Dr. Priya Kulkarni assigned_batches")
        
    # Check if student Aarav Deshmukh is linked to 11th pcm tarabai park
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
                batch="11th pcm tarabai park",
                branch="Tarabai Park",
                academic_year="2026-2027"
            )
            await aarav_student.insert()
        else:
            aarav_student.standard = "11th Science"
            aarav_student.batch = "11th pcm tarabai park"
            await aarav_student.save()
            
    print("Seed complete! 12 Batches created.")

if __name__ == "__main__":
    asyncio.run(seed())
