from app.models.inventory import InventoryItem, InventoryDelivery
from app.models.student import Student
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemRestock,
    InventoryDeliveryCreate,
    InventoryDeliveryUpdate
)
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime
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
    """No hardcoded auto-injection. Users fill inventory information by themselves."""
    pass

async def add_inventory_item(item_in: InventoryItemCreate) -> dict:
    item_dict = item_in.model_dump() if hasattr(item_in, "model_dump") else item_in.dict()
    if not item_dict.get("title"):
        cat = item_dict.get("category", "Theory")
        subj = item_dict.get("subject", "Physics")
        item_dict["title"] = f"{cat} - {subj}"
    item = InventoryItem(**item_dict)
    await item.insert()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def update_inventory_item(item_id: str, update_in: InventoryItemUpdate) -> dict:
    try:
        item = await InventoryItem.get(ObjectId(item_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")
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

async def delete_inventory_item(item_id: str) -> dict:
    try:
        item = await InventoryItem.get(ObjectId(item_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")
    if not item:
        raise HTTPException(status_code=404, detail="Book item not found")
    await item.delete()
    return {"message": "Book item removed successfully", "id": item_id}

async def adjust_inventory_stock(item_id: str, delta: int) -> dict:
    try:
        item = await InventoryItem.get(ObjectId(item_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")
    if not item:
        raise HTTPException(status_code=404, detail="Book item not found")
    item.in_stock = max(0, item.in_stock + delta)
    await item.save()
    d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    d["id"] = str(item.id)
    return d

async def restock_inventory_item(item_id: str, restock_in: InventoryItemRestock) -> dict:
    try:
        item = await InventoryItem.get(ObjectId(item_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")
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
    items = await InventoryItem.find_all().to_list()
    res = []
    for item in items:
        d = item.model_dump() if hasattr(item, "model_dump") else item.dict()
        d["id"] = str(item.id)
        if not d.get("category"):
            d["category"] = "Theory"
        if not d.get("subject"):
            d["subject"] = "General"
        if not d.get("total_stock"):
            d["total_stock"] = d.get("in_stock", 50)
        res.append(d)
    return res

async def _format_delivery(delivery: InventoryDelivery) -> dict:
    student_obj = None
    if getattr(delivery, 'student', None):
        if isinstance(delivery.student, Student):
            student_obj = delivery.student
        elif hasattr(delivery.student, 'ref'):
            try:
                student_obj = await Student.get(delivery.student.ref.id)
                delivery.student = student_obj
            except Exception:
                student_obj = None

    recipient_type = getattr(delivery, "recipient_type", None) or ("Student" if student_obj or getattr(delivery, 'student', None) else "Teacher" if getattr(delivery, 'student_roll_no', '') == "Faculty Staff" else "Student")
    recipient_name = getattr(delivery, "recipient_name", None) or delivery.handed_over_to or ""
    roll_number = getattr(delivery, "student_roll_no", None) or ""

    if student_obj:
        if not roll_number:
            roll_number = student_obj.student_id or "N/A"
        if not recipient_name and getattr(student_obj, "user", None):
            try:
                user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
                if user_obj:
                    recipient_name = user_obj.full_name
            except Exception:
                pass

    if not recipient_name:
        recipient_name = "Unknown " + recipient_type

    if not roll_number:
        roll_number = "Faculty Staff" if recipient_type == "Teacher" else "N/A"

    item_obj = None
    if isinstance(delivery.inventory_item, InventoryItem):
        item_obj = delivery.inventory_item
    elif getattr(delivery, 'inventory_item', None) and hasattr(delivery.inventory_item, 'ref'):
        try:
            item_obj = await InventoryItem.get(delivery.inventory_item.ref.id)
            delivery.inventory_item = item_obj
        except Exception:
            item_obj = None

    category = delivery.category
    if not category:
        if item_obj and getattr(item_obj, "category", None):
            category = item_obj.category
        else:
            category = "CET" if "cet" in (delivery.book_title or "").lower() else "Theory"

    subject = delivery.subject
    if not subject:
        if item_obj and getattr(item_obj, "subject", None):
            subject = item_obj.subject
        else:
            t = (delivery.book_title or "").lower()
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

    book_title = delivery.book_title or (item_obj.title if item_obj else f"{category} - {subject}")
    handed_over_by = delivery.handed_over_by or delivery.verified_by or "--"

    date_str = "--"
    raw_date_iso = None
    if delivery.date:
        date_str = delivery.date.strftime("%Y-%m-%d %H:%M")
        raw_date_iso = delivery.date.isoformat()
    elif delivery.status in ["Delivered", "Handed Over"]:
        date_str = delivery.created_at.strftime("%Y-%m-%d %H:%M") if delivery.created_at else "--"
        raw_date_iso = delivery.created_at.isoformat() if delivery.created_at else None

    return {
        "id": str(delivery.id),
        "recipient_type": recipient_type,
        "recipient_name": recipient_name,
        "recipient_id": getattr(delivery, "recipient_id", None) or (str(student_obj.id) if student_obj else ""),
        "student_id": str(student_obj.id) if student_obj else (getattr(delivery, "recipient_id", None) or ""),
        "student_name": recipient_name,
        "roll_number": roll_number,
        "book_title": book_title,
        "category": category,
        "subject": subject,
        "item_id": str(item_obj.id) if item_obj else None,
        "available_stock": item_obj.in_stock if item_obj else 0,
        "quantity": getattr(delivery, 'quantity', 1) or 1,
        "status": delivery.status,
        "date": date_str,
        "raw_date": raw_date_iso,
        "handed_over_by": handed_over_by,
        "handed_over_to": delivery.handed_over_to or recipient_name,
        "verified_by": handed_over_by,
        "remarks": delivery.remarks or ""
    }

async def add_delivery(delivery_in: InventoryDeliveryCreate, current_user_name: Optional[str] = None) -> dict:
    recipient_type = delivery_in.recipient_type or "Student"
    recipient_name = delivery_in.recipient_name or ""
    recipient_id = delivery_in.recipient_id or delivery_in.student_id or ""
    student = None
    roll_no = "N/A"

    if recipient_type == "Student" and recipient_id:
        try:
            from app.services.student_service import resolve_student
            student = await resolve_student(recipient_id)
            if student:
                roll_no = student.student_id or "N/A"
                if not recipient_name and getattr(student, "user", None):
                    try:
                        u = student.user if isinstance(student.user, User) else await User.get(student.user.ref.id)
                        if u:
                            recipient_name = u.full_name
                    except Exception:
                        pass
        except Exception:
            pass
    elif recipient_type == "Teacher":
        roll_no = "Faculty Staff"
        if not recipient_name and recipient_id:
            try:
                u = await User.get(ObjectId(recipient_id))
                if u:
                    recipient_name = u.full_name
            except Exception:
                pass

    if not recipient_name:
        recipient_name = delivery_in.recipient_name or ("Student" if recipient_type == "Student" else "Teacher")

    category = delivery_in.category or "Theory"
    subject = delivery_in.subject or "Physics"
    book_title = delivery_in.book_title or f"{category} - {subject}"

    item = None
    if delivery_in.inventory_item_id:
        try:
            item = await InventoryItem.get(ObjectId(delivery_in.inventory_item_id))
        except Exception:
            item = None

    if not item:
        matched_items = await InventoryItem.find(
            InventoryItem.category == category,
            InventoryItem.subject == subject
        ).to_list()
        if matched_items:
            item = matched_items[0]

    status = delivery_in.status or "Delivered"
    handed_by = delivery_in.handed_over_by or delivery_in.verified_by or current_user_name or "Academy Staff"
    
    handover_date = delivery_in.date
    if not handover_date and status in ["Delivered", "Handed Over"]:
        handover_date = datetime.utcnow()

    qty = getattr(delivery_in, "quantity", 1) or 1

    delivery = InventoryDelivery(
        student=student,
        inventory_item=item,
        book_title=book_title,
        category=category,
        subject=subject,
        recipient_type=recipient_type,
        recipient_name=recipient_name,
        recipient_id=str(recipient_id) if recipient_id else None,
        quantity=qty,
        status=status,
        date=handover_date,
        handed_over_by=handed_by,
        verified_by=handed_by,
        handed_over_to=recipient_name,
        student_roll_no=roll_no,
        remarks=delivery_in.remarks
    )
    await delivery.insert()

    # Decrement available stock if delivered or handed over
    if status in ["Delivered", "Handed Over"] and item and item.in_stock > 0:
        item.in_stock = max(0, item.in_stock - qty)
        await item.save()

    return await _format_delivery(delivery)

async def update_delivery(id: str, update_in: InventoryDeliveryUpdate, current_user_name: Optional[str] = None) -> dict:
    try:
        delivery = await InventoryDelivery.get(ObjectId(id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery ID format")
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    old_status = delivery.status
    old_cat = delivery.category
    old_subj = delivery.subject

    if update_in.recipient_type:
        delivery.recipient_type = update_in.recipient_type

    target_id = update_in.recipient_id or update_in.student_id
    if target_id:
        delivery.recipient_id = str(target_id)
        if delivery.recipient_type == "Student":
            try:
                from app.services.student_service import resolve_student
                student = await resolve_student(target_id)
                if student:
                    delivery.student = student
                    delivery.student_roll_no = student.student_id or "N/A"
                    if getattr(student, "user", None):
                        try:
                            u = student.user if isinstance(student.user, User) else await User.get(student.user.ref.id)
                            if u:
                                delivery.handed_over_to = u.full_name
                                delivery.recipient_name = u.full_name
                        except Exception:
                            pass
            except Exception:
                pass
        elif delivery.recipient_type == "Teacher":
            delivery.student = None
            delivery.student_roll_no = "Faculty Staff"
            try:
                u = await User.get(ObjectId(target_id))
                if u:
                    delivery.handed_over_to = u.full_name
                    delivery.recipient_name = u.full_name
            except Exception:
                pass

    if update_in.recipient_name:
        delivery.recipient_name = update_in.recipient_name
        delivery.handed_over_to = update_in.recipient_name

    if update_in.category:
        delivery.category = update_in.category
    if update_in.subject:
        delivery.subject = update_in.subject

    delivery.book_title = update_in.book_title or f"{delivery.category} - {delivery.subject}"

    if update_in.date is not None:
        delivery.date = update_in.date

    new_status = update_in.status or delivery.status
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

    # Check status transitions for stock adjustments
    qty = getattr(delivery, "quantity", 1) or 1
    if new_status in ["Delivered", "Handed Over"] and old_status not in ["Delivered", "Handed Over"]:
        if not delivery.date:
            delivery.date = datetime.utcnow()
        # Decrement stock
        target_item = None
        if getattr(delivery, "inventory_item", None):
            try:
                if isinstance(delivery.inventory_item, InventoryItem):
                    target_item = delivery.inventory_item
                elif hasattr(delivery.inventory_item, "ref"):
                    target_item = await InventoryItem.get(delivery.inventory_item.ref.id)
            except Exception:
                pass
        if not target_item and delivery.category and delivery.subject:
            target_item = await InventoryItem.find_one(
                InventoryItem.category == delivery.category,
                InventoryItem.subject == delivery.subject
            )
        if target_item and target_item.in_stock > 0:
            target_item.in_stock = max(0, target_item.in_stock - qty)
            await target_item.save()
            delivery.inventory_item = target_item

    elif new_status not in ["Delivered", "Handed Over"] and old_status in ["Delivered", "Handed Over"]:
        delivery.date = None
        # Restore stock
        target_item = None
        if getattr(delivery, "inventory_item", None):
            try:
                if isinstance(delivery.inventory_item, InventoryItem):
                    target_item = delivery.inventory_item
                elif hasattr(delivery.inventory_item, "ref"):
                    target_item = await InventoryItem.get(delivery.inventory_item.ref.id)
            except Exception:
                pass
        if not target_item and old_cat and old_subj:
            target_item = await InventoryItem.find_one(
                InventoryItem.category == old_cat,
                InventoryItem.subject == old_subj
            )
        if target_item:
            target_item.in_stock += qty
            await target_item.save()

    await delivery.save()
    return await _format_delivery(delivery)

async def delete_delivery(id: str) -> dict:
    try:
        delivery = await InventoryDelivery.get(ObjectId(id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery ID format")
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    # Restore stock if was delivered
    if delivery.status in ["Delivered", "Handed Over"]:
        qty = getattr(delivery, "quantity", 1) or 1
        try:
            target_item = None
            if getattr(delivery, "inventory_item", None):
                if isinstance(delivery.inventory_item, InventoryItem):
                    target_item = delivery.inventory_item
                elif hasattr(delivery.inventory_item, "ref"):
                    target_item = await InventoryItem.get(delivery.inventory_item.ref.id)
            if not target_item and delivery.category and delivery.subject:
                target_item = await InventoryItem.find_one(
                    InventoryItem.category == delivery.category,
                    InventoryItem.subject == delivery.subject
                )
            if target_item:
                target_item.in_stock += qty
                await target_item.save()
        except Exception as e:
            print(f"Warning: could not restore stock on delete: {e}")

    await delivery.delete()
    return {"message": "Delivery record removed successfully", "id": id}

async def get_deliveries(student_id: Optional[str] = None) -> list[dict]:
    if student_id:
        from app.services.student_service import resolve_student
        student = await resolve_student(student_id)
        if student:
            deliveries = await InventoryDelivery.find({"student.$id": student.id}).to_list()
            return [await _format_delivery(d) for d in deliveries]

    deliveries = await InventoryDelivery.find_all().to_list()
    # Sort latest first
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

    # Query deliveries for this student by object ID or student_id string
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
