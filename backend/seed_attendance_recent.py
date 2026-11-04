import asyncio
import os
import sys
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db
from app.models.student import Student
from app.models.attendance import Attendance

async def seed_attendance():
    await init_db()
    
    students = await Student.find_all().to_list()
    tp_students = [s for s in students if 'tarabai' in (s.branch or '').lower()]
    mp_students = [s for s in students if 'mangal' in (s.branch or '').lower()]
    
    print(f"Found {len(tp_students)} Tarabai Park students and {len(mp_students)} Mangalvar Peth students.")
    
    # We want records for the past 14 days up to today (2026-11-02)
    today = datetime(2026, 11, 2)
    
    # Delete existing attendance records for these dates to avoid duplicates
    start_date = today - timedelta(days=14)
    end_date = today + timedelta(days=1)
    
    del_res = await Attendance.find({
        "$and": [
            {"student": {"$ne": None}},
            {"date": {"$gte": start_date, "$lt": end_date}}
        ]
    }).delete()
    print(f"Cleaned up {getattr(del_res, 'deleted_count', 0)} existing recent attendance records.")
    
    new_records = []
    
    # Seed dates from today-13 down to today
    for day_offset in range(14):
        cur_date = today - timedelta(days=13 - day_offset)
        # Skip Sundays
        if cur_date.weekday() == 6:
            continue
            
        cur_day_str = cur_date.strftime("%Y-%m-%d")
        is_today = (cur_day_str == "2026-11-02")
        
        # Tarabai Park (22 students)
        # Target for today: exactly 18 Present, 4 Absent
        # For other days: random between 17 and 20 Present
        if is_today:
            tp_absent_count = 4
        else:
            tp_absent_count = random.choice([2, 3, 4, 3, 5])
            
        tp_shuffled = list(tp_students)
        # Deterministic shuffle by day
        random.Random(cur_day_str + "_tp").shuffle(tp_shuffled)
        tp_absent_set = set(s.id for s in tp_shuffled[:tp_absent_count])
        
        for s in tp_students:
            status = "Absent" if s.id in tp_absent_set else "Present"
            rec_date = cur_date.replace(hour=9, minute=0, second=0)
            new_records.append(Attendance(
                student=s,
                date=rec_date,
                status=status,
                lecture_slot=1,
                subject="Physics",
                branch=s.branch or "Tarabai Park",
                academic_batch=s.academic_batch or "11th PCM",
                session=s.session,
                batch=s.academic_batch or s.batch,
                remarks="Present on time" if status == "Present" else "Uninformed Absence"
            ))
            
        # Mangalvar Peth (14 students)
        # Target for today: exactly 12 Present, 2 Absent
        # For other days: random between 11 and 13 Present
        if is_today:
            mp_absent_count = 2
        else:
            mp_absent_count = random.choice([1, 2, 3, 2, 1])
            
        mp_shuffled = list(mp_students)
        random.Random(cur_day_str + "_mp").shuffle(mp_shuffled)
        mp_absent_set = set(s.id for s in mp_shuffled[:mp_absent_count])
        
        for s in mp_students:
            status = "Absent" if s.id in mp_absent_set else "Present"
            rec_date = cur_date.replace(hour=9, minute=30, second=0)
            new_records.append(Attendance(
                student=s,
                date=rec_date,
                status=status,
                lecture_slot=1,
                subject="Physics",
                branch=s.branch or "Mangalvar Peth",
                academic_batch=s.academic_batch or "11th PCM",
                session=s.session,
                batch=s.academic_batch or s.batch,
                remarks="Present on time" if status == "Present" else "Uninformed Absence"
            ))

    if new_records:
        await Attendance.insert_many(new_records)
        print(f"Successfully inserted {len(new_records)} attendance records.")

if __name__ == "__main__":
    asyncio.run(seed_attendance())
