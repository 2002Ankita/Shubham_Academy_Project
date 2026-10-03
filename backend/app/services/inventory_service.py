from app.models.inventory import InventoryItem, InventoryDelivery
from app.models.student import Student
from app.models.user import User
from app.schemas.inventory import InventoryItemCreate, InventoryDeliveryCreate, InventoryDeliveryUpdate
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime

async def add_inventory_item(item_in: InventoryItemCreate) -> dict:
    item = InventoryItem(**item_in.dict())
    await item.insert()
    d = item.dict()
    d["id"] = str(item.id)
    return d

async def get_inventory_items() -> list[dict]:
    items = await InventoryItem.find_all().to_list()
    res = []
    for item in items:
        d = item.dict()
        d["id"] = str(item.id)
        res.append(d)
    return res

async def _format_delivery(delivery: InventoryDelivery) -> dict:
    student_obj = None
    if isinstance(delivery.student, Student):
        student_obj = delivery.student
    elif getattr(delivery, 'student', None):
        student_obj = await Student.get(delivery.student.ref.id)
        delivery.student = student_obj

    student_name = ""
    roll_number = ""
    if student_obj:
        roll_number = student_obj.student_id
        if getattr(student_obj, "user", None):
            user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name

    item_obj = None
    if isinstance(delivery.inventory_item, InventoryItem):
        item_obj = delivery.inventory_item
    elif getattr(delivery, 'inventory_item', None):
        item_obj = await InventoryItem.get(delivery.inventory_item.ref.id)
        delivery.inventory_item = item_obj

    return {
        "id": str(delivery.id),
        "student_name": student_name,
        "roll_number": roll_number,
        "book_title": item_obj.title if item_obj else "",
        "status": delivery.status,
        "date": delivery.date.strftime("%Y-%m-%d") if delivery.date else "--",
        "verified_by": delivery.verified_by or "--"
    }

async def add_delivery(delivery_in: InventoryDeliveryCreate) -> dict:
    from app.services.student_service import resolve_student
    student = await resolve_student(delivery_in.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    item = await InventoryItem.get(ObjectId(delivery_in.inventory_item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    delivery = InventoryDelivery(
        student=student,
        inventory_item=item
    )
    await delivery.insert()
    return await _format_delivery(delivery)

async def update_delivery(id: str, update_in: InventoryDeliveryUpdate) -> dict:
    delivery = await InventoryDelivery.get(ObjectId(id))
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
        
    delivery.status = update_in.status
    if update_in.status == "Delivered":
        delivery.date = datetime.utcnow()
        if update_in.verified_by:
            delivery.verified_by = update_in.verified_by
            
        # Update stock
        item = await InventoryItem.get(delivery.inventory_item.ref.id)
        if item and item.in_stock > 0:
            item.in_stock -= 1
            await item.save()
            
    await delivery.save()
    return await _format_delivery(delivery)

async def get_deliveries() -> list[dict]:
    deliveries = await InventoryDelivery.find_all().to_list()
    return [await _format_delivery(d) for d in deliveries]
