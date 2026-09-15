from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class SkillLevel(str, enum.Enum):
    BASIC = "BASIC"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class Resource(Base):
    __tablename__ = "resources"

    resource_id = Column(Integer, primary_key=True, index=True)
    department = Column(String(50), nullable=False, index=True)
    skill = Column(String(100), nullable=False)
    skill_level = Column(Enum(SkillLevel), default=SkillLevel.INTERMEDIATE)
    team_size = Column(Integer, default=1)
    availability = Column(Text, nullable=True)  # JSON schedule: {monday: [[9,17]], tuesday: [[9,17]], ...}
    equipment = Column(Text, nullable=True)  # JSON list of equipment
    location = Column(String(200), nullable=True)
    max_hours_per_day = Column(Integer, default=8)
    max_hours_per_week = Column(Integer, default=40)
    meta_data = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    plan_assignments = relationship("PlanAssignment", back_populates="resource")

    def __repr__(self):
        return f"<Resource(resource_id={self.resource_id}, department='{self.department}', skill='{self.skill}')>"

class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    head_of_department = Column(String(100), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    budget_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    meta_data = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    resources = relationship("Resource", primaryjoin="Department.name==foreign(Resource.department)", backref="dept_info")
    assets = relationship("Asset", primaryjoin="Department.name==foreign(Asset.department)", backref="dept_info")
    maintenance_tasks = relationship("MaintenanceTask", primaryjoin="Department.name==foreign(MaintenanceTask.department)", backref="dept_info")

    def __repr__(self):
        return f"<Department(department_id={self.department_id}, name='{self.name}')>"