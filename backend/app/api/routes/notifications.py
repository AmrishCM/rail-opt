from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.auth import User
from ...models.execution import Notification
from ...utils.security import get_current_user

router = APIRouter()

@router.get("")
def get_notifications(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    role = user.role if user else "MAINTENANCE_ENGINEER"
    user_id = user.user_id if user else None

    # Fetch notifications targeted to user or user's role
    query = db.query(Notification).filter(
        (Notification.target_role == role) |
        (Notification.user_id == user_id) |
        (Notification.target_role.is_(None))
    ).order_by(Notification.created_at.desc()).limit(20)

    items = query.all()
    unread_count = sum(1 for n in items if not n.is_read)

    return {
        "unread_count": unread_count,
        "items": [
            {
                "notification_id": n.notification_id,
                "title": n.title,
                "message": n.message,
                "link": n.link,
                "type": n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None
            } for n in items
        ]
    }

@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"status": "success"}

@router.post("/read-all")
def mark_all_read(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    role = user.role if user else "MAINTENANCE_ENGINEER"
    db.query(Notification).filter(Notification.target_role == role).update({"is_read": True})
    db.commit()
    return {"status": "success"}
