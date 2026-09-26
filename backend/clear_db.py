import asyncio
import motor.motor_asyncio

async def clear():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    await client.drop_database('academy_management')

if __name__ == "__main__":
    asyncio.run(clear())
