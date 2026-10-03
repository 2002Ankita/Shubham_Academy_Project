import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.student import Student
from app.models.fees import FeePayment, FeeStructure
from app.models.user import User
from app.services.fee_service import get_all_fee_payments
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Student, FeePayment, FeeStructure])
    
    try:
        fees = await get_all_fee_payments()
        print("Success, fees:", len(fees))
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
