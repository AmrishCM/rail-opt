from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from ...db.session import get_db
from ...models.auth import User, Role, Permission, Division
from ...models.scenario import AuditLog
from ...utils.security import (
    verify_password,
    create_access_token,
    create_and_store_refresh_token,
    verify_and_revoke_refresh_token,
    revoke_user_refresh_tokens,
    get_current_user,
    require_current_user,
    require_permission,
    require_role
)

router = APIRouter()

class LoginRequest(BaseModel):
    username: str  # Can be email or employee_id
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    user_id: int
    employee_id: str
    email: str
    full_name: str
    role: str
    department: str
    division_name: Optional[str] = None
    section_code: Optional[str] = None
    last_login: Optional[str] = None
    permissions: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class DemoUserItem(BaseModel):
    employee_id: str
    email: str
    full_name: str
    role: str
    department: str
    section_code: Optional[str] = None
    display_title: str
    description: str

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Match on email or employee_id
    user = db.query(User).filter(
        (User.email == request.username) | (User.employee_id == request.username)
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID / Email or Password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact railway administrator."
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Fetch user's permissions
    permissions = []
    if user.role == "SYSTEM_ADMIN":
        permissions = [p.code for p in db.query(Permission).all()]
    elif user.role_rel:
        permissions = [p.code for p in user.role_rel.permissions]

    div_name = user.division_rel.name if user.division_rel else "Headquarters"

    # Log audit
    audit = AuditLog(
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.user_id),
        user_id=user.employee_id,
        details=f"User {user.full_name} ({user.role}) logged in successfully"
    )
    db.add(audit)
    db.commit()

    token_data = {"sub": user.email, "role": user.role, "user_id": user.user_id}
    access_token = create_access_token(data=token_data)
    refresh_token = create_and_store_refresh_token(db, user.user_id)

    user_resp = UserResponse(
        user_id=user.user_id,
        employee_id=user.employee_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department=user.department,
        division_name=div_name,
        section_code=user.section_code,
        last_login=user.last_login.isoformat() if user.last_login else None,
        permissions=permissions
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user_resp)

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    user = verify_and_revoke_refresh_token(db, request.refresh_token)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, revoked, or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token_data = {"sub": user.email, "role": user.role, "user_id": user.user_id}
    new_access = create_access_token(data=token_data)
    new_refresh = create_and_store_refresh_token(db, user.user_id)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(
    request: Optional[RefreshTokenRequest] = None,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request and request.refresh_token:
        verify_and_revoke_refresh_token(db, request.refresh_token)

    if user:
        revoke_user_refresh_tokens(db, user.user_id)
        audit = AuditLog(
            action="USER_LOGOUT",
            entity_type="USER",
            entity_id=str(user.user_id),
            user_id=user.employee_id,
            details=f"User {user.full_name} ({user.role}) logged out"
        )
        db.add(audit)
        db.commit()

    return {"status": "SUCCESS", "message": "Successfully logged out of RailOpt-AI."}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    permissions = []
    if user.role == "SYSTEM_ADMIN":
        permissions = [p.code for p in db.query(Permission).all()]
    elif user.role_rel:
        permissions = [p.code for p in user.role_rel.permissions]

    div_name = user.division_rel.name if user.division_rel else "Headquarters"

    return UserResponse(
        user_id=user.user_id,
        employee_id=user.employee_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department=user.department,
        division_name=div_name,
        section_code=user.section_code,
        last_login=user.last_login.isoformat() if user.last_login else None,
        permissions=permissions
    )

@router.get("/demo-users", response_model=List[DemoUserItem])
def get_demo_users(db: Session = Depends(get_db)):
    """
    Returns all 8 pre-seeded SIH demo users for the 1-click role switcher.
    """
    role_meta = {
        "SYSTEM_ADMIN": ("System Administrator", "Full access: System configuration, CP-SAT solver parameters, audit logs, demo reset"),
        "OPERATIONS_MANAGER": ("Operations / Division Manager", "Division oversight: Review AI plans, approve/reject blocks, train impact analysis, replanning"),
        "MAINTENANCE_ENGINEER": ("Maintenance Engineer (C2)", "Core workflow: Report maintenance, review AI priority, generate plans, submit for approval"),
        "TRACK_USER": ("Engineering / Track Lead", "Department view: Permanent way, track geometry, rail defects, and civil maintenance blocks"),
        "SIGNAL_USER": ("S&T / Signalling Lead", "Department view: Electronic interlocking, point machines, signal aspects, track circuits"),
        "TRACTION_USER": ("Traction Distribution Lead", "Department view: 25kV OHE power-blocks, tower wagons, catenary tensioners"),
        "FIELD_INSPECTOR": ("Field Inspector / Crew", "Mobile field view: Today's assignments, start work, photograph evidence, complete checklist"),
        "AUDITOR_VIEWER": ("Auditor / Safety Viewer", "Read-only access: Approved plans, KPIs, safety compliance, and audit trails")
    }

    users = db.query(User).order_by(User.user_id.asc()).all()
    results = []
    for u in users:
        title, desc = role_meta.get(u.role, (u.role, "Railway Operations User"))
        results.append(DemoUserItem(
            employee_id=u.employee_id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            department=u.department,
            section_code=u.section_code,
            display_title=title,
            description=desc
        ))
    return results

@router.get("/roles")
def list_roles(user: Optional[User] = Depends(require_permission("users:manage")), db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [{"role_id": r.role_id, "name": r.name, "display_name": r.display_name, "permissions": [p.code for p in r.permissions]} for r in roles]

@router.get("/permissions")
def list_permissions(user: Optional[User] = Depends(require_permission("users:manage")), db: Session = Depends(get_db)):
    perms = db.query(Permission).all()
    return [{"permission_id": p.permission_id, "code": p.code, "description": p.description} for p in perms]
