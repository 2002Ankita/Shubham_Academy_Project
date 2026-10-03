import asyncio
from app.core.database import init_db
from app.models.batch import Batch

async def main():
    await init_db()
    batches = await Batch.find_all().to_list()
    for b in batches:
        print(f"Batch: {b.name}, Std: {b.standard}, Sub: {b.subject}, Time: {b.time}, Teacher: {b.teacher_name}")

if __name__ == "__main__":
    asyncio.run(main())
