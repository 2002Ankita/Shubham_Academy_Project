from app.models.inventory import InventoryItem, InventoryDelivery
from app.models.student import Student
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemRestock,
    InventoryItemUpdate,
    InventoryDeliveryCreate,
    InventoryDeliveryUpdate
)
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional

DEFAULT_BOOKS = [
    # Theory Books
    {"title": "Theory - Physics", "category": "Theory", "subject": "Physics", "standard": "11th & 12th Science", "in_stock": 50, "reorder_level": 15, "unit_cost": 350.0},
    {"title": "Theory - Chemistry", "category": "Theory", "subject": "Chemistry", "standard": "11th & 12th Science", "in_stock": 50, "reorder_level": 15, "unit_cost": 350.0},
    {"title": "Theory - Biology", "category": "Theory", "subject": "Biology", "standard": "11th & 12th Science", "in_stock": 45, "reorder_level": 15, "unit_cost": 350.0},
    {"title": "Theory - Mathematics", "category": "Theory", "subject": "Maths", "standard": "11th & 12th Science", "in_stock": 50, "reorder_level": 15, "unit_cost": 350.0},
    # CET Books
    {"title": "CET - Physics", "category": "CET", "subject": "Physics", "standard": "11th & 12th Science", "in_stock": 55, "reorder_level": 15, "unit_cost": 400.0},
    {"title": "CET - Chemistry", "category": "CET", "subject": "Chemistry", "standard": "11th & 12th Science", "in_stock": 55, "reorder_level": 15, "unit_cost": 400.0},
    {"title": "CET - Biology", "category": "CET", "subject": "Biology", "standard": "11th & 12th Science", "in_stock": 40, "reorder_level": 15, "unit_cost": 400.0},
    {"title": "CET - Mathematics", "category": "CET", "subject": "Maths", "standard": "11th & 12th Science", "in_stock": 50, "reorder_level": 15, "unit_cost": 400.0},
]

async def ensure_default_books():
    """Ensure that the core Theory, CET, and module books exist in inventory items."""
    try:
        count = await InventoryItem.count()
        if count == 0:
            for book in DEFAULT_BOOKS:
                new_item = InventoryItem(**book)
                await new_item.insert()
    except Exception as e:
        print(f"Error ensuring default books: {e}")

async def add_inventory_item(item_in: InventoryItemCreate) -> dict:
    item_dict = item_in.model_dump() if hasattr(item_in, "model_dump") else item_in.dict()
    if not item_dict.get("total_stock"):
        item_dict["total_stock"] = item_dict.get("in_stock", 0)
    item = InventoryItem(**item_dict)
    await item.insert()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def update_inventory_item(item_id: str, update_in: InventoryItemUpdate) -> dict:
    item = await InventoryItem.get(ObjectId(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Book item not found")
    
    update_data = (update_in.model_dump(exclude_unset=True) 
                   if hasattr(update_in, "model_dump") 
                   else update_in.dict(exclude_unset=True))
    
    for key, value in update_data.items():
        if value is not None:
            setattr(item, key, value)
            
    await item.save()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def adjust_inventory_stock(item_id: str, delta: int) -> dict:
    item = await InventoryItem.get(ObjectId(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Book item not found")
    item.in_stock = max(0, item.in_stock + delta)
    await item.save()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def restock_inventory_item(item_id: str, restock_in: InventoryItemRestock) -> dict:
    item = await InventoryItem.get(ObjectId(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    qty = max(0, restock_in.quantity)
    item.in_stock += qty
    item.total_stock = (item.total_stock or 0) + qty
    await item.save()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def get_inventory_items() -> list[dict]:
    await ensure_default_books()
    items = await InventoryItem.find_all().to_list()
    res = []
    for item in items:
        d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
        d["id"] = str(item.id)
        if not d.get("total_stock"):
            d["total_stock"] = d.get("in_stock", 0)
        # Ensure category and subject exist for legacy records
        if not d.get("category"):
            d["category"] = "CET" if "cet" in (d.get("title") or "").lower() else "Theory"
        if not d.get("subject"):
            t = (d.get("title") or "").lower()
            if "physic" in t:
                d["subject"] = "Physics"
            elif "chem" in t:
                d["subject"] = "Chemistry"
            elif "bio" in t:
                d["subject"] = "Biology"
            elif "math" in t:
                d["subject"] = "Maths"
            else:
                d["subject"] = "General"
        res.append(d)
    return res

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

    book_title = delivery.book_title or (item_obj.title if item_obj else "Study Notes Package")
    
    category = delivery.category
    if not category:
        if item_obj and getattr(item_obj, "category", None):
            category = item_obj.category
        else:
            category = "CET" if "cet" in book_title.lower() else "Theory"

    subject = delivery.subject
    if not subject:
        if item_obj and getattr(item_obj, "subject", None):
            subject = item_obj.subject
        else:
            t = book_title.lower()
            if "physic" in t:
                subject = "Physics"
            elif "chem" in t:
                subject = "Chemistry"
            elif "bio" in t:
                subject = "Biology"
            elif "math" in t:
                subject = "Maths"
            else:
                subject = "General"

    handed_by = delivery.handed_over_by or delivery.verified_by or "Academic Staff"
    handed_to = student_name or delivery.handed_over_to or "Student"
    
    date_str = "--"
    if delivery.date:
        date_str = delivery.date.strftime("%Y-%m-%d %H:%M")
    elif delivery.status in ["Delivered", "Handed Over"]:
        date_str = delivery.created_at.strftime("%Y-%m-%d %H:%M") if delivery.created_at else "--"

    return {
        "id": str(delivery.id),
        "student_id": str(student_obj.id) if student_obj else (delivery.student_roll_no or ""),
        "student_name": handed_to,
        "roll_number": roll_number or "N/A",
        "book_title": book_title,
        "category": category,
        "subject": subject,
        "item_id": str(item_obj.id) if item_obj else None,
        "available_stock": item_obj.in_stock if item_obj else 0,
        "quantity": getattr(delivery, 'quantity', 1) or 1,
        "handed_over_by": handed_by,
        "handed_over_to": handed_to,
        "status": delivery.status or "Handed Over",
        "date": date_str,
        "verified_by": delivery.verified_by or handed_by,
        "remarks": delivery.remarks or ""
    }

async def add_delivery(delivery_in: InventoryDeliveryCreate, current_user_name: Optional[str] = None) -> dict:
    student_obj = None
    if delivery_in.student_id:
        from app.services.student_service import resolve_student
        try:
            student_obj = await resolve_student(delivery_in.student_id)
        except Exception:
            student_obj = None

    await ensure_default_books()
    
    item = None
    if delivery_in.inventory_item_id:
        try:
            item = await InventoryItem.get(ObjectId(delivery_in.inventory_item_id))
        except Exception:
            item = None

    category = delivery_in.category or "Theory"
    subject = delivery_in.subject or "Physics"
    
    if not item:
        matched_items = await InventoryItem.find(
            InventoryItem.category == category,
            InventoryItem.subject == subject
        ).to_list()
        if matched_items:
            item = matched_items[0]

    book_title = delivery_in.book_title
    if not book_title:
        book_title = item.title if item else f"{category} - {subject}"

    # Student name resolution
    student_name = delivery_in.handed_over_to or ""
    roll_no = delivery_in.student_roll_no or ""

    if student_obj:
        if not roll_no:
            roll_no = student_obj.student_id or ""
        if not student_name and getattr(student_obj, "user", None):
            try:
                user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
                if user_obj:
                    student_name = user_obj.full_name
            except Exception:
                pass

    if not student_name:
        student_name = "Student"

    qty = max(1, delivery_in.quantity)
    status = delivery_in.status or "Handed Over"
    handed_by = delivery_in.handed_over_by or delivery_in.verified_by or current_user_name or "Academic Staff"
    handover_date = datetime.utcnow() if status in ["Handed Over", "Delivered"] else None

    # Decrement available stock if handing over/delivered
    if status in ["Handed Over", "Delivered"] and item and item.in_stock > 0:
        item.in_stock = max(0, item.in_stock - qty)
        await item.save()

    delivery = InventoryDelivery(
        student=student_obj,
        inventory_item=item,
        book_title=book_title,
        category=category,
        subject=subject,
        quantity=qty,
        handed_over_by=handed_by,
        handed_over_to=student_name,
        student_roll_no=roll_no,
        standard=delivery_in.standard or (student_obj.standard if student_obj else (item.standard if item else None)),
        status=status,
        date=handover_date,
        verified_by=handed_by,
        remarks=delivery_in.remarks
    )
    await delivery.insert()

    return await _format_delivery(delivery)

async def update_delivery(id: str, update_in: InventoryDeliveryUpdate, current_user_name: Optional[str] = None) -> dict:
    try:
        delivery = await InventoryDelivery.get(ObjectId(id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery ID")

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    old_status = delivery.status
    new_status = update_in.status
    delivery.status = new_status

    if update_in.remarks is not None:
        delivery.remarks = update_in.remarks

    if update_in.handed_over_by or update_in.verified_by:
        staff_name = update_in.handed_over_by or update_in.verified_by
        delivery.handed_over_by = staff_name
        delivery.verified_by = staff_name
    elif not delivery.handed_over_by and current_user_name:
        delivery.handed_over_by = current_user_name
        delivery.verified_by = current_user_name

    # Handle status transition and stock adjustments
    qty = getattr(delivery, 'quantity', 1) or 1
    if new_status in ["Delivered", "Handed Over"] and old_status not in ["Delivered", "Handed Over"]:
        delivery.date = datetime.utcnow()
        if getattr(delivery, "inventory_item", None):
            try:
                item = await InventoryItem.get(delivery.inventory_item.ref.id)
                if item and item.in_stock > 0:
                    item.in_stock = max(0, item.in_stock - qty)
                    await item.save()
            except Exception:
                pass
    elif new_status not in ["Delivered", "Handed Over"] and old_status in ["Delivered", "Handed Over"]:
        delivery.date = None
        if getattr(delivery, "inventory_item", None):
            try:
                item = await InventoryItem.get(delivery.inventory_item.ref.id)
                if item:
                    item.in_stock += qty
                    await item.save()
            except Exception:
                pass

    await delivery.save()
    return await _format_delivery(delivery)

async def delete_delivery(id: str) -> dict:
    delivery = await InventoryDelivery.get(ObjectId(id))
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    qty = getattr(delivery, 'quantity', 1) or 1
    if delivery.status in ["Delivered", "Handed Over"] and getattr(delivery, "inventory_item", None):
        try:
            item = await InventoryItem.get(delivery.inventory_item.ref.id)
            if item:
                item.in_stock += qty
                await item.save()
        except Exception:
            pass

    await delivery.delete()
    return {"message": "Delivery record removed successfully", "id": id}

async def get_deliveries(student_id: Optional[str] = None) -> list[dict]:
    await ensure_default_books()
    if student_id:
        from app.services.student_service import resolve_student
        student = await resolve_student(student_id)
        if student:
            deliveries = await InventoryDelivery.find({"student.$id": student.id}).to_list()
            return [await _format_delivery(d) for d in deliveries]

    deliveries = await InventoryDelivery.find_all().to_list()
    deliveries.sort(key=lambda d: d.created_at or datetime.min, reverse=True)
    return [await _format_delivery(d) for d in deliveries]

async def get_student_book_delivery_status(student_id_or_user_id: str) -> dict:
    """
    Returns subject-wise status of Theory and CET books delivery for the given student.
    Connects with Student Dashboard to show delivered or pending per subject.
    """
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id_or_user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    await ensure_default_books()

    deliveries = await InventoryDelivery.find({"student.$id": student.id}).to_list()
    if not deliveries and student.student_id:
        deliveries = await InventoryDelivery.find(InventoryDelivery.student_roll_no == student.student_id).to_list()

    formatted_deliveries = [await _format_delivery(d) for d in deliveries]

    subjects = ["Physics", "Chemistry", "Biology", "Maths"]
    categories = ["Theory", "CET"]

    status_matrix = {
        "Theory": {},
        "CET": {}
    }

    for cat in categories:
        for subj in subjects:
            status_matrix[cat][subj] = {
                "delivered": False,
                "status": "Not Delivered",
                "date": None,
                "handed_over_by": None,
                "delivery_id": None,
                "book_title": f"{cat} - {subj}"
            }

    delivered_count = 0
    pending_count = 0

    for fd in formatted_deliveries:
        cat_raw = (fd.get("category") or "").strip().lower()
        title_raw = (fd.get("book_title") or "").strip().lower()
        subj_raw = (fd.get("subject") or "").strip().lower()

        cat = "CET" if "cet" in cat_raw or "cet" in title_raw else "Theory"

        target_subj = None
        if "physic" in subj_raw or "physic" in title_raw:
            target_subj = "Physics"
        elif "chem" in subj_raw or "chem" in title_raw:
            target_subj = "Chemistry"
        elif "bio" in subj_raw or "bio" in title_raw:
            target_subj = "Biology"
        elif "math" in subj_raw or "math" in title_raw:
            target_subj = "Maths"

        if target_subj and cat in status_matrix:
            is_delivered = fd.get("status") in ["Delivered", "Handed Over"]
            current_status = status_matrix[cat][target_subj]
            if is_delivered or current_status["status"] == "Not Delivered":
                status_matrix[cat][target_subj] = {
                    "delivered": is_delivered,
                    "status": fd.get("status"),
                    "date": fd.get("date"),
                    "handed_over_by": fd.get("handed_over_by"),
                    "delivery_id": fd.get("id"),
                    "book_title": fd.get("book_title")
                }

    for cat in categories:
        for subj in subjects:
            if status_matrix[cat][subj]["delivered"]:
                delivered_count += 1
            elif status_matrix[cat][subj]["status"] == "Pending Pickup":
                pending_count += 1

    not_delivered_count = 8 - (delivered_count + pending_count)

    student_name = ""
    if getattr(student, "user", None):
        try:
            user_obj = student.user if isinstance(student.user, User) else await User.get(student.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name
        except Exception:
            pass

    return {
        "student": {
            "id": str(student.id),
            "student_id": student.student_id,
            "name": student_name,
            "standard": student.standard,
            "batch": student.batch
        },
        "theory": status_matrix["Theory"],
        "cet": status_matrix["CET"],
        "deliveries": formatted_deliveries,
        "summary": {
            "total_books": 8,
            "delivered_count": delivered_count,
            "pending_count": pending_count,
            "not_delivered_count": not_delivered_count
        }
    }
