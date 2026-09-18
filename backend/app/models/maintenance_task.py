from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class TaskStatus(str, enum.Enum):
    # Canonical workflow statuses (full state machine)
    REPORTED = "REPORTED"
    AI_PLANNING = "AI_PLANNING"
    PLAN_READY = "PLAN_READY"
    MANAGER_REVIEW = "MANAGER_REVIEW"
    APPROVED = "APPROVED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    REPLAN_REQUESTED = "REPLAN_REQUESTED"
    AI_REPLANNING = "AI_REPLANNING"
    REPLANNED = "REPLANNED"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    # Legacy / compatibility
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    UNDER_REVIEW = "UNDER_REVIEW"
    PLAN_REQUIRED = "PLAN_REQUIRED"
    PLAN_CREATED = "PLAN_CREATED"
    SCHEDULED = "SCHEDULED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ANALYZING = "ANALYZING"
    AI_RECOMMENDATION_READY = "AI_RECOMMENDATION_READY"
    PLAN_PENDING_REVIEW = "PLAN_PENDING_REVIEW"
    PLAN_PENDING_APPROVAL = "PLAN_PENDING_APPROVAL"
    COMPLETED = "COMPLETED"
    DEFERRED = "DEFERRED"
    REPLAN_REQUIRED = "REPLAN_REQUIRED"
    OPEN = "OPEN"
    PRIORITIZED = "PRIORITIZED"


class TaskType(str, enum.Enum):
    PREVENTIVE = "PREVENTIVE"
    CORRECTIVE = "CORRECTIVE"
    EMERGENCY = "EMERGENCY"
    INSPECTION = "INSPECTION"

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(50), unique=True, nullable=True, index=True)  # e.g. "IR-2026-0042"
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=True)
    location_name = Column(String(100), nullable=True)
    department = Column(String(50), nullable=False)
    task_type = Column(Enum(TaskType), nullable=False, default=TaskType.CORRECTIVE)
    defect_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(Integer, nullable=False)  # 1-10 scale
    photo_evidence = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    idempotency_key = Column(String(100), nullable=True, index=True)
    detected_at = Column(DateTime, nullable=False, default=func.now())
    due_date = Column(DateTime, nullable=True)
    preferred_date = Column(DateTime, nullable=True)
    preferred_start = Column(DateTime, nullable=True)
    preferred_end = Column(DateTime, nullable=True)
    estimated_duration = Column(Integer, nullable=False)  # minutes
    required_resources = Column(Text, nullable=True)  # JSON
    required_block_type = Column(String(50), nullable=True)
    safety_impact = Column(Integer, nullable=False, default=5)  # 1-10 scale
    failure_probability = Column(Float, nullable=True, default=0.5)  # 0-1
    overdue_days = Column(Integer, default=0)
    priority_score = Column(Integer, nullable=True)  # 0-100
    priority_level = Column(String(20), nullable=True)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(Enum(TaskStatus), default=TaskStatus.NEW)
    current_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id", use_alter=True, name="fk_maintenance_tasks_plan_id"), nullable=True)
    dependencies = Column(Text, nullable=True)  # JSON array of task IDs
    assigned_to_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    asset = relationship("Asset", back_populates="maintenance_tasks")
    corridor = relationship("Corridor")
    section = relationship("Section")
    current_plan = relationship("MaintenancePlan", foreign_keys=[current_plan_id])
    plan_assignments = relationship("PlanAssignment", back_populates="task")
    assigned_user = relationship("User", foreign_keys=[assigned_to_user_id])
    created_user = relationship("User", foreign_keys=[created_by_user_id])

    @property
    def id(self):
        return self.task_id

    @property
    def request_number(self):
        return self.reference_no

    @property
    def estimated_duration_minutes(self):
        return self.estimated_duration

    @property
    def reported_at(self):
        return self.detected_at

    def __repr__(self):
        return f"<MaintenanceTask(id={self.task_id}, ref={self.reference_no}, desc='{self.description[:30]}...', status={self.status})>"

# Alias for canonical nomenclature
MaintenanceRequest = MaintenanceTask
