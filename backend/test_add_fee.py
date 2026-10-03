import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.student import Student
from app.models.fees import FeePayment, FeeStructure
from app.models.user import User
from app.schemas.fees import FeePaymentCreate
from app.services.fee_service import add_fee_payment
from beanie import init_beanie

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['academy_management']
    await init_beanie(database=db, document_models=[User, Student, FeePayment, FeeStructure])
    
    try:
        payment = FeePaymentCreate(
            student_id='6aba40c2d78ab7ff1eb60ac9',
            amount_paid=1000,
            payment_method='Online',
            transaction_reference='TXN123',
            remarks='Manual Collection',
            total_course_fees_override=50000
        )
        fees = await add_fee_payment(payment)
        print("Success, fees:", fees)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
