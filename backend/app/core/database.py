from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    
    from app.models.user import User
    from app.models.student import Student
    from app.models.teacher import Teacher
    from app.models.attendance import Attendance
    from app.models.fees import FeeStructure, FeePayment
    from app.models.marks import Exam, Mark
    from app.models.notices import Notice
    from app.models.salary import SalaryPayment
    from app.models.material import Material
    from app.models.leave_request import LeaveRequest
    from app.models.inventory import InventoryItem, InventoryDelivery
    
    # We will add our models to the document_models list later as we create them
    await init_beanie(
        database=database, 
        document_models=[
            User, Student, Teacher, Attendance, FeeStructure, FeePayment, Exam, Mark, Notice, SalaryPayment, Material, LeaveRequest, InventoryItem, InventoryDelivery
        ]
    )
