from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone

from ...db.session import get_db
from ...models.auth import User, Role, Permission, Division
from ...models.scenario import AuditLog
from ...utils.security import (
    get_password_hash,
    require_permission,
    require_role,
    revoke_user_refresh_tokens,
    get_current_user
)

router = APIRouter()

class UserCreateRequest(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    password: str
    role: str
    department: str
    division_id: Optional[int] = None
    section_code: Optional[str] = None
    is_active: bool = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    division_id: Optional[int] = None
    section_code: Optional[str] = None
    is_active: Optional[bool] = None

class StatusToggleRequest(BaseModel):
    is_active: bool

class PasswordResetRequest(BaseModel):
    new_password: str

class UserDetailResponse(BaseModel):
    user_id: int
    employee_id: str
    full_name: str
    email: str
    role: str
    department: str
    division_id: Optional[int] = None
    division_name: Optional[str] = None
    section_code: Optional[str] = None
    is_active: bool
    last_login: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}

class RolePermissionResponse(BaseModel):
    role_id: int
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = []

@router.get("", response_model=List[UserDetailResponse])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_permission("users:view")),
    db: Session = Depends(get_db)
):
    """
    List all railway users. Protected with users:view permission (SYSTEM_ADMIN only).
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if department:
        query = query.filter(User.department == department)
    if search:
        query = query.filter(
            (User.employee_id.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    users = query.order_by(User.user_id.asc()).all()
    results = []
    for u in users:
        div_name = u.division_rel.name if u.division_rel else "Headquarters"
        results.append(UserDetailResponse(
            user_id=u.user_id,
            employee_id=u.employee_id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            department=u.department,
            division_id=u.division_id,
            division_name=div_name,
            section_code=u.section_code,
            is_active=u.is_active,
            last_login=u.last_login.isoformat() if u.last_login else None,
            created_at=u.created_at.isoformat() if u.created_at else None
        ))
    return results

@router.post("", response_model=UserDetailResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserCreateRequest,
    current_user: User = Depends(require_permission("users:create")),
    db: Session = Depends(get_db)
):
    """
    Create a new railway system user. Requires users:create permission.
    """
    # Check uniqueness
    if db.query(User).filter(User.employee_id == req.employee_id).first():
        raise HTTPException(status_code=400, detail=f"Employee ID '{req.employee_id}' already exists")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail=f"Email '{req.email}' already exists")

    # Match role
    role_obj = db.query(Role).filter(Role.name == req.role).first()
    role_id = role_obj.role_id if role_obj else None

    hashed_pwd = get_password_hash(req.password)

    new_user = User(
        employee_id=req.employee_id,
        full_name=req.full_name,
        email=req.email,
        hashed_password=hashed_pwd,
        role=req.role,
        role_id=role_id,
        department=req.department,
        division_id=req.division_id,
        section_code=req.section_code or "ALL",
        is_active=req.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit = AuditLog(
        action="USER_CREATE",
        entity_type="USER",
        entity_id=str(new_user.user_id),
        user_id=current_user.employee_id,
        details=f"Created user {new_user.employee_id} ({new_user.full_name}) with role {new_user.role}"
    )
    db.add(audit)
    db.commit()

    div_name = new_user.division_rel.name if new_user.division_rel else "Headquarters"
    return UserDetailResponse(
        user_id=new_user.user_id,
        employee_id=new_user.employee_id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        division_id=new_user.division_id,
        division_name=div_name,
        section_code=new_user.section_code,
        is_active=new_user.is_active,
        last_login=None,
        created_at=new_user.created_at.isoformat() if new_user.created_at else None
    )

@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_permission("users:view")),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    div_name = u.division_rel.name if u.division_rel else "Headquarters"
    return UserDetailResponse(
        user_id=u.user_id,
        employee_id=u.employee_id,
        full_name=u.full_name,
        email=u.email,
        role=u.role,
        department=u.department,
        division_id=u.division_id,
        division_name=div_name,
        section_code=u.section_code,
        is_active=u.is_active,
        last_login=u.last_login.isoformat() if u.last_login else None,
        created_at=u.created_at.isoformat() if u.created_at else None
    )

@router.put("/{user_id}", response_model=UserDetailResponse)
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    current_user: User = Depends(require_permission("users:update")),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = u.role
    if req.full_name is not None:
        u.full_name = req.full_name
    if req.email is not None:
        u.email = req.email
    if req.role is not None:
        u.role = req.role
        role_obj = db.query(Role).filter(Role.name == req.role).first()
        if role_obj:
            u.role_id = role_obj.role_id
    if req.department is not None:
        u.department = req.department
    if req.division_id is not None:
        u.division_id = req.division_id
    if req.section_code is not None:
        u.section_code = req.section_code
    if req.is_active is not None:
        u.is_active = req.is_active

    db.commit()

    audit = AuditLog(
        action="USER_UPDATE",
        entity_type="USER",
        entity_id=str(u.user_id),
        user_id=current_user.employee_id,
        details=f"Updated user {u.employee_id}. Role changed from {old_role} to {u.role}"
    )
    db.add(audit)
    db.commit()

    div_name = u.division_rel.name if u.division_rel else "Headquarters"
    return UserDetailResponse(
        user_id=u.user_id,
        employee_id=u.employee_id,
        full_name=u.full_name,
        email=u.email,
        role=u.role,
        department=u.department,
        division_id=u.division_id,
        division_name=div_name,
        section_code=u.section_code,
        is_active=u.is_active,
        last_login=u.last_login.isoformat() if u.last_login else None,
        created_at=u.created_at.isoformat() if u.created_at else None
    )

@router.put("/{user_id}/status")
def toggle_user_status(
    user_id: int,
    req: StatusToggleRequest,
    current_user: User = Depends(require_permission("users:disable")),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.is_active = req.is_active
    if not req.is_active:
        revoke_user_refresh_tokens(db, u.user_id)
    db.commit()

    action_label = "ACTIVATED" if req.is_active else "DISABLED"
    audit = AuditLog(
        action="USER_STATUS_CHANGE",
        entity_type="USER",
        entity_id=str(u.user_id),
        user_id=current_user.employee_id,
        details=f"User {u.employee_id} {action_label}"
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "message": f"User {u.employee_id} status updated to {'Active' if req.is_active else 'Disabled'}."}

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    req: PasswordResetRequest,
    current_user: User = Depends(require_permission("users:update")),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.hashed_password = get_password_hash(req.new_password)
    revoke_user_refresh_tokens(db, u.user_id)
    db.commit()

    audit = AuditLog(
        action="PASSWORD_RESET",
        entity_type="USER",
        entity_id=str(u.user_id),
        user_id=current_user.employee_id,
        details=f"Password reset for user {u.employee_id}"
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "message": f"Password reset successfully for {u.employee_id}."}

@router.get("/meta/roles")
def get_user_roles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [{"role_id": r.role_id, "name": r.name, "display_name": r.display_name, "permissions": [p.code for p in r.permissions]} for r in roles]

