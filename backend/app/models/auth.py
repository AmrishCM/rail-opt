import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base

class UserRoleEnum(str, enum.Enum):
    # 4 Canonical Roles
    INSPECTOR = "INSPECTOR"
    MANAGER = "MANAGER"
    ENGINEER = "ENGINEER"
    ADMIN = "ADMIN"
    # Legacy & specialized aliases
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    MAINTENANCE_ENGINEER = "MAINTENANCE_ENGINEER"
    TRACK_USER = "TRACK_USER"
    SIGNAL_USER = "SIGNAL_USER"
    TRACTION_USER = "TRACTION_USER"
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    AUDITOR_VIEWER = "AUDITOR_VIEWER"

def to_canonical_role(role_name: str) -> str:
    if not role_name:
        return "INSPECTOR"
    norm = str(role_name).strip().upper()
    if norm in ["INSPECTOR", "FIELD_INSPECTOR"]:
        return "INSPECTOR"
    if norm in ["MANAGER", "OPERATIONS_MANAGER"]:
        return "MANAGER"
    if norm in ["ENGINEER", "MAINTENANCE_ENGINEER", "TRACK_USER", "SIGNAL_USER", "TRACTION_USER"]:
        return "ENGINEER"
    if norm in ["ADMIN", "SYSTEM_ADMIN"]:
        return "ADMIN"
    if norm == "AUDITOR_VIEWER":
        return "INSPECTOR"
    return "ENGINEER"

# Association table for Role <-> Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.role_id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.permission_id", ondelete="CASCADE"), primary_key=True),
)

class Permission(Base):
    __tablename__ = "permissions"

    permission_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g. "maintenance:create", "plan:approve"
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

    def __repr__(self):
        return f"<Permission(code='{self.code}')>"

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # SYSTEM_ADMIN, etc.
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", back_populates="role_rel")

    def __repr__(self):
        return f"<Role(name='{self.name}')>"

class Division(Base):
    __tablename__ = "divisions"

    division_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. "Delhi Division", "Ahmedabad Division"
    code = Column(String(20), unique=True, nullable=False)  # "DLI", "ADI"
    headquarters = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    users = relationship("User", back_populates="division_rel")

    def __repr__(self):
        return f"<Division(code='{self.code}', name='{self.name}')>"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "EMP-ENG-101"
    email = Column(String(120), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # UserRoleEnum string
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=True)
    department = Column(String(100), nullable=False)  # "Engineering/Track", "S&T/Signalling", etc.
    division_id = Column(Integer, ForeignKey("divisions.division_id"), nullable=True)
    section_code = Column(String(50), nullable=True)  # e.g. "C2-02" or "C2"
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    role_rel = relationship("Role", back_populates="users")
    division_rel = relationship("Division", back_populates="users")

    def __repr__(self):
        return f"<User(emp_id='{self.employee_id}', email='{self.email}', role='{self.role}')>"

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken(user_id={self.user_id}, revoked={self.revoked})>"

