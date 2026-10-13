from app.models.inventory import InventoryItem, InventoryDelivery
from app.models.student import Student
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemRestock,
    InventoryDeliveryCreate,
    InventoryDeliveryUpdate
)
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timedelta

async def seed_initial_inventory_if_empty():
    count = await InventoryItem.count()
    if count > 0:
        return

    # Seed realistic study notes inventory
    sample_items = [
        InventoryItem(
            title="Matrices & Differential Calculus Handbook",
            standard="12th pcm tarabai park",
            subject="Mathematics",
            in_stock=45,
            total_stock=60,
            reorder_level=15,
            unit_cost=350.0
        ),
        InventoryItem(
            title="Rotational Dynamics & Wave Optics Key Derivations",
            standard="12th pcm tarabai park",
            subject="Physics",
            in_stock=38,
            total_stock=60,
            reorder_level=15,
            unit_cost=420.0
        ),
        InventoryItem(
            title="Chemical Thermodynamics & Coordination Compounds",
            standard="12th pcb tarabai park",
            subject="Chemistry",
            in_stock=12,
            total_stock=50,
            reorder_level=15,
            unit_cost=380.0
        ),
        InventoryItem(
            title="Modern Physics Numerical Problem-Solving Guide",
            standard="12th pcm Mangalvar peth",
            subject="Physics",
            in_stock=52,
            total_stock=70,
            reorder_level=20,
            unit_cost=400.0
        ),
        InventoryItem(
            title="Genetic Inheritance & Molecular Biology Handbook",
            standard="12th pcb Mangalvar peth",
            subject="Biology",
            in_stock=8,
            total_stock=40,
            reorder_level=10,
            unit_cost=450.0
        ),
        InventoryItem(
            title="Thermodynamics & Kinetic Theory Revision Notes",
            standard="11th pcm tarabai park",
            subject="Physics",
            in_stock=64,
            total_stock=80,
            reorder_level=20,
            unit_cost=320.0
        ),
        InventoryItem(
            title="Organic Chemistry Reaction Mechanism Reference",
            standard="11th pcmb tarabai park",
            subject="Chemistry",
            in_stock=5,
            total_stock=50,
            reorder_level=15,
            unit_cost=390.0
        ),
    ]

    for item in sample_items:
        await item.insert()

    # Seed initial handover records
    # Try resolving an existing student from DB if available
    first_student = await Student.find_one()
    item_math = await InventoryItem.find_one(InventoryItem.title == "Matrices & Differential Calculus Handbook")
    item_phys = await InventoryItem.find_one(InventoryItem.title == "Rotational Dynamics & Wave Optics Key Derivations")
    item_chem = await InventoryItem.find_one(InventoryItem.title == "Chemical Thermodynamics & Coordination Compounds")
    item_bio = await InventoryItem.find_one(InventoryItem.title == "Genetic Inheritance & Molecular Biology Handbook")

    now = datetime.utcnow()
    sample_deliveries = []

    if item_phys:
        sample_deliveries.append(
            InventoryDelivery(
                student=first_student,
                inventory_item=item_phys,
                quantity=1,
                handed_over_by="Dr. Priya Kulkarni (Physics Faculty)",
                handed_over_to="Aarav Deshmukh",
                student_roll_no="STU-2026-001",
                standard="12th Science - Alpha",
                status="Handed Over",
                date=now - timedelta(days=1, hours=3),
                verified_by="Dr. Priya Kulkarni",
                remarks="Direct classroom handover with formula cheat sheet"
            )
        )

    if item_math:
        sample_deliveries.append(
            InventoryDelivery(
                student=first_student,
                inventory_item=item_math,
                quantity=1,
                handed_over_by="Prof. Shubham Sharma (Academic Director)",
                handed_over_to="Rohan Patil",
                student_roll_no="STU-2026-002",
                standard="12th Science - Alpha",
                status="Handed Over",
                date=now - timedelta(days=2, hours=5),
                verified_by="Prof. Shubham Sharma",
                remarks="Collected at Admin Desk, parent signature confirmed"
            )
        )

    if item_chem:
        sample_deliveries.append(
            InventoryDelivery(
                student=first_student,
                inventory_item=item_chem,
                quantity=1,
                handed_over_by="Prof. Rajesh Patil (Chemistry Faculty)",
                handed_over_to="Neha Joshi",
                student_roll_no="STU-2026-003",
                standard="12th Science - Beta",
                status="Handed Over",
                date=now - timedelta(days=3, hours=2),
                verified_by="Prof. Rajesh Patil",
                remarks="Post-laboratory session distribution, signed in register"
            )
        )

    if item_bio:
        sample_deliveries.append(
            InventoryDelivery(
                student=first_student,
                inventory_item=item_bio,
                quantity=1,
                handed_over_by="Dr. Sneha Deshmukh (Biology Faculty)",
                handed_over_to="Aditya Shinde",
                student_roll_no="STU-2026-004",
                standard="12th Science - Beta",
                status="Handed Over",
                date=now - timedelta(days=4, hours=1),
                verified_by="Dr. Sneha Deshmukh",
                remarks="Distributed with model question paper set"
            )
        )

    for deliv in sample_deliveries:
        await deliv.insert()

async def add_inventory_item(item_in: InventoryItemCreate) -> dict:
    data = item_in.dict()
    if not data.get("total_stock"):
        data["total_stock"] = data.get("in_stock", 0)
    item = InventoryItem(**data)
    await item.insert()
    d = item.dict()
    d["id"] = str(item.id)
    return d

async def get_inventory_items() -> list[dict]:
    await seed_initial_inventory_if_empty()
    items = await InventoryItem.find_all().to_list()
    res = []
    for item in items:
        d = item.dict()
        d["id"] = str(item.id)
        if not d.get("total_stock"):
            d["total_stock"] = d.get("in_stock", 0)
        res.append(d)
    return res

async def restock_inventory_item(item_id: str, restock_in: InventoryItemRestock) -> dict:
    item = await InventoryItem.get(ObjectId(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    qty = max(0, restock_in.quantity)
    item.in_stock += qty
    item.total_stock = (item.total_stock or 0) + qty
    await item.save()
    d = item.dict()
    d["id"] = str(item.id)
    return d

async def _format_delivery(delivery: InventoryDelivery) -> dict:
    student_obj = None
    if isinstance(delivery.student, Student):
        student_obj = delivery.student
    elif getattr(delivery, 'student', None) and getattr(delivery.student, 'ref', None):
        try:
            student_obj = await Student.get(delivery.student.ref.id)
            delivery.student = student_obj
        except Exception:
            student_obj = None

    student_name = delivery.handed_over_to or ""
    roll_number = delivery.student_roll_no or ""
    if student_obj:
        if not roll_number:
            roll_number = student_obj.student_id or ""
        if not student_name and getattr(student_obj, "user", None):
            try:
                user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
                if user_obj:
                    student_name = user_obj.full_name
            except Exception:
                pass

    item_obj = None
    if isinstance(delivery.inventory_item, InventoryItem):
        item_obj = delivery.inventory_item
    elif getattr(delivery, 'inventory_item', None) and getattr(delivery.inventory_item, 'ref', None):
        try:
            item_obj = await InventoryItem.get(delivery.inventory_item.ref.id)
            delivery.inventory_item = item_obj
        except Exception:
            item_obj = None

    handed_by = delivery.handed_over_by or delivery.verified_by or "Academic Staff"
    handed_to = student_name or delivery.handed_over_to or "Student"
    formatted_date = delivery.date.strftime("%d %b %Y, %I:%M %p") if delivery.date else "--"

    return {
        "id": str(delivery.id),
        "student_name": handed_to,
        "roll_number": roll_number or "--",
        "book_title": item_obj.title if item_obj else "Study Notes Package",
        "item_id": str(item_obj.id) if item_obj else None,
        "available_stock": item_obj.in_stock if item_obj else 0,
        "quantity": getattr(delivery, 'quantity', 1) or 1,
        "handed_over_by": handed_by,
        "handed_over_to": handed_to,
        "status": delivery.status or "Handed Over",
        "date": formatted_date,
        "verified_by": delivery.verified_by or handed_by,
        "remarks": delivery.remarks or ""
    }

async def add_delivery(delivery_in: InventoryDeliveryCreate, current_user_name: str = None) -> dict:
    student_obj = None
    if delivery_in.student_id:
        from app.services.student_service import resolve_student
        try:
            student_obj = await resolve_student(delivery_in.student_id)
        except Exception:
            student_obj = None

    try:
        item = await InventoryItem.get(ObjectId(delivery_in.inventory_item_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid inventory item ID")

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    qty = max(1, delivery_in.quantity)
    handed_by = delivery_in.handed_over_by or current_user_name or "Academic Staff"
    
    student_name = delivery_in.handed_over_to
    roll_no = delivery_in.student_roll_no

    if student_obj:
        if not roll_no:
            roll_no = student_obj.student_id
        if not student_name and getattr(student_obj, "user", None):
            try:
                user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
                if user_obj:
                    student_name = user_obj.full_name
            except Exception:
                pass

    if not student_name:
        student_name = "Student"

    # Decrement available stock if handing over
    status = delivery_in.status or "Handed Over"
    if status in ["Handed Over", "Delivered"]:
        item.in_stock = max(0, item.in_stock - qty)
        await item.save()

    delivery = InventoryDelivery(
        student=student_obj,
        inventory_item=item,
        quantity=qty,
        handed_over_by=handed_by,
        handed_over_to=student_name,
        student_roll_no=roll_no,
        standard=delivery_in.standard or (student_obj.standard if student_obj else item.standard),
        status=status,
        date=datetime.utcnow(),
        verified_by=handed_by,
        remarks=delivery_in.remarks
    )
    await delivery.insert()
    return await _format_delivery(delivery)

async def update_delivery(id: str, update_in: InventoryDeliveryUpdate) -> dict:
    try:
        delivery = await InventoryDelivery.get(ObjectId(id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery ID")

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
        
    old_status = delivery.status
    delivery.status = update_in.status

    if update_in.handed_over_by:
        delivery.handed_over_by = update_in.handed_over_by
    if update_in.verified_by:
        delivery.verified_by = update_in.verified_by
    if update_in.remarks:
        delivery.remarks = update_in.remarks

    # If status changed to Handed Over/Delivered, deduct stock
    if update_in.status in ["Handed Over", "Delivered"] and old_status not in ["Handed Over", "Delivered"]:
        delivery.date = datetime.utcnow()
        try:
            item = await InventoryItem.get(delivery.inventory_item.ref.id)
            if item and item.in_stock > 0:
                item.in_stock = max(0, item.in_stock - getattr(delivery, 'quantity', 1))
                await item.save()
        except Exception:
            pass

    await delivery.save()
    return await _format_delivery(delivery)

async def get_deliveries() -> list[dict]:
    await seed_initial_inventory_if_empty()
    deliveries = await InventoryDelivery.find_all().to_list()
    # Sort reverse by date/created_at
    deliveries.sort(key=lambda d: d.created_at, reverse=True)
    return [await _format_delivery(d) for d in deliveries]
