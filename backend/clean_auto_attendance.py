import asyncio
from app.core.database import init_db
from app.models.attendance import Attendance

async def main():
    await init_db()
    records = await Attendance.find(
        {"remarks": {"$regex": "Auto Check-In on Faculty Login", "$options": "i"}}
    ).to_list()
    print(f"Found {len(records)} auto check-in records to remove:")
    for r in records:
        print(f"  Removing: {r.id} - Date: {r.date} - Status: {r.status} - Remarks: {r.remarks}")
        await r.delete()
    print("Cleanup complete!")

if __name__ == "__main__":
    asyncio.run(main())
