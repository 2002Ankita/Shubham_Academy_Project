import asyncio
from app.models.batch import Batch

async def test():
    batch = Batch(name="n", standard="s", subject="su", student_count=1)
    d = batch.dict()
    print(d.keys())

asyncio.run(test())
