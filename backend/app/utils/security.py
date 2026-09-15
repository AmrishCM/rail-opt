import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from ..db.session import get_db
from ..models.auth import User, Permission, RefreshToken, to_canonical_role

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "railopt_ai_sih2026_super_secret_production_key_4railway"))
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))  # 30 minutes production token
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

import bcrypt
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_and_store_refresh_token(db: Session, user_id: int) -> str:
    token_str = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    rf = RefreshToken(
        token=token_str,
        user_id=user_id,
        expires_at=expires_at,
        revoked=False
    )
    db.add(rf)
    db.commit()
    return token_str

def verify_and_revoke_refresh_token(db: Session, token_str: str) -> Optional[User]:
    rf = db.query(RefreshToken).filter(RefreshToken.token == token_str).first()
    if not rf:
        return None
    if rf.revoked:
        return None
    now_utc = datetime.now(timezone.utc)
    # Handle timezone naive vs aware
    exp = rf.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc:
        return None

    # Rotate / revoke used token
    rf.revoked = True
    db.commit()

    return db.query(User).filter(User.user_id == rf.user_id).first()

def revoke_user_refresh_tokens(db: Session, user_id: int):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
    db.commit()

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Canonical alias
decode_token = decode_access_token

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    return user

def require_current_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def normalize_permission_code(code: str) -> str:
    return code.strip().replace(".", ":")

PERMISSION_ALIASES = {
    "planning:approve": ["plan:approve", "planning:approve"],
    "plan:approve": ["plan:approve", "planning:approve"],
    "planning:create": ["plan:create", "planning:create"],
    "plan:create": ["plan:create", "planning:create"],
    "planning:view": ["plan:view", "planning:view"],
    "plan:view": ["plan:view", "planning:view"],
    "planning:reject": ["plan:reject", "planning:reject"],
    "plan:reject": ["plan:reject", "planning:reject"],
    "planning:replan": ["plan:replan", "planning:replan", "replan:execute"],
    "issue:create": ["issue:create", "maintenance:create"],
    "maintenance:create": ["issue:create", "maintenance:create"],
    "issue:approve": ["issue:approve", "issue:review", "maintenance:approve", "planning:approve", "plan:approve"],
    "issue:reject": ["issue:reject", "issue:review", "planning:reject", "plan:reject"],
    "issue:assign": ["issue:assign", "issue:review", "planning:create", "plan:create"],
    "issue:review": ["issue:review", "issue:approve", "planning:approve"],
    "execution:start": ["execution:update", "execution:start", "task:start"],
    "execution:complete": ["execution:update", "execution:complete", "task:complete"],
    "authority:contact": ["authority:contact", "planning:approve", "issue:review"],
}

def require_permission(required_permission: str):
    """
    Dependency factory to check if user has the specific permission code.
    ADMIN / SYSTEM_ADMIN automatically has all permissions.
    """
    norm_code = normalize_permission_code(required_permission)
    aliases = PERMISSION_ALIASES.get(norm_code, [norm_code])

    def permission_checker(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to perform this action"
            )

        canonical = to_canonical_role(user.role)
        if canonical == "ADMIN" or user.role in ["SYSTEM_ADMIN", "ADMIN"]:
            return user

        user_role = user.role_rel
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: No role assigned to user"
            )

        perm_codes = {normalize_permission_code(p.code) for p in user_role.permissions}
        if not any(a in perm_codes for a in aliases):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required permission '{required_permission}' is not granted to role '{user.role}'"
            )

        return user

    return permission_checker

def require_role(allowed_roles: List[str]):
    """
    Dependency factory to check if user role is within allowed_roles list.
    Supports canonical roles (INSPECTOR, MANAGER, ENGINEER, ADMIN) as well as legacy roles.
    ADMIN / SYSTEM_ADMIN has unrestricted operational authority.
    """
    normalized_allowed = {r.strip().upper() for r in allowed_roles}
    canonical_allowed = {to_canonical_role(r) for r in allowed_roles}

    def role_checker(user: Optional[User] = Depends(get_current_user)):
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )

        user_role = str(user.role).strip().upper()
        canonical_user_role = to_canonical_role(user_role)

        if canonical_user_role == "ADMIN" or user_role in ["SYSTEM_ADMIN", "ADMIN"]:
            return user

        if user_role in normalized_allowed or canonical_user_role in canonical_allowed or canonical_user_role in normalized_allowed:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{user.role}' is not authorized for this operation"
        )

    return role_checker

def get_user_data_scope(user: User) -> Dict[str, Any]:
    """
    Returns organizational scope dict based on canonical role:
    - is_global: bool (ADMIN or ALL sections)
    - division_id: Optional[int]
    - department: Optional[str]
    - section_code: Optional[str]
    """
    canonical = to_canonical_role(user.role)

    if canonical == "ADMIN" or user.role in ["SYSTEM_ADMIN", "AUDITOR_VIEWER"] or user.section_code == "ALL":
        return {"is_global": True, "division_id": None, "department": None, "section_code": None}

    if canonical == "MANAGER" or user.role == "OPERATIONS_MANAGER":
        return {"is_global": False, "division_id": user.division_id, "department": None, "section_code": None}

    if canonical == "INSPECTOR" or user.role == "FIELD_INSPECTOR":
        return {"is_global": False, "division_id": user.division_id, "department": user.department, "section_code": user.section_code}

    # Department engineers (Track, S&T, Traction, Maintenance)
    return {"is_global": False, "division_id": user.division_id, "department": user.department, "section_code": None}

