from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class PlanStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    GENERATED = "GENERATED"
    AI_RECOMMENDED = "AI_RECOMMENDED"
    ENGINEER_REVIEW = "ENGINEER_REVIEW"
    MANAGER_APPROVAL = "MANAGER_APPROVAL"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    REVISION_REQUIRED = "REVISION_REQUIRED"
    CANCELLED = "CANCELLED"
    SUPERSEDED = "SUPERSEDED"

class PlanType(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    AD_HOC = "AD_HOC"

class MaintenancePlan(Base):
    __tablename__ = "maintenance_plans"

    plan_id = Column(Integer, primary_key=True, index=True)
    plan_number = Column(String(50), unique=False, nullable=True, index=True)  # e.g. PLAN-2026-00124 (shared across versions)
    maintenance_request_id = Column(Integer, ForeignKey("maintenance_tasks.task_id", use_alter=True, name="fk_maintenance_plans_task_id"), nullable=True)
    version = Column(Integer, default=1, nullable=False)
    previous_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=True)
    replan_reason = Column(Text, nullable=True)
    corridor_id = Column(Integer, nullable=True)
    section_id = Column(Integer, nullable=True)
    plan_name = Column(String(200), nullable=False)
    plan_type = Column(Enum(PlanType), default=PlanType.DAILY)
    status = Column(Enum(PlanStatus), default=PlanStatus.AI_RECOMMENDED)
    horizon_start = Column(DateTime, nullable=False)
    horizon_end = Column(DateTime, nullable=False)
    corridor_ids = Column(Text, nullable=True)  # JSON array of corridor IDs
    departments = Column(Text, nullable=True)  # JSON array of department names
    objective_weights = Column(Text, nullable=True)  # JSON object with weights
    total_score = Column(Float, nullable=True)
    asset_availability = Column(Float, nullable=True)
    train_impact_minutes = Column(Integer, nullable=True)
    maintenance_completion_percent = Column(Float, nullable=True)
    block_utilization_percent = Column(Float, nullable=True)
    coordination_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)  # User ID or username
    submitted_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    maintenance_request = relationship("MaintenanceTask", foreign_keys=[maintenance_request_id])
    previous_plan = relationship("MaintenancePlan", remote_side=[plan_id], foreign_keys=[previous_plan_id])
    assignments = relationship("PlanAssignment", back_populates="plan", cascade="all, delete-orphan")
    approvals = relationship("PlanApproval", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MaintenancePlan(plan_id={self.plan_id}, number='{self.plan_number}', v={self.version}, status={self.status})>"

class PlanAssignment(Base):
    __tablename__ = "plan_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=False)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.task_id"), nullable=False)
    block_id = Column(Integer, ForeignKey("block_windows.block_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.resource_id"), nullable=True)
    assigned_start_time = Column(DateTime, nullable=False)
    assigned_end_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED
    efficiency_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    plan = relationship("MaintenancePlan", back_populates="assignments")
    task = relationship("MaintenanceTask", back_populates="plan_assignments")
    block = relationship("BlockWindow", back_populates="plan_assignments")
    resource = relationship("Resource", back_populates="plan_assignments")

    def __repr__(self):
        return f"<PlanAssignment(assignment_id={self.assignment_id}, plan_id={self.plan_id}, task_id={self.task_id})>"

class PlanApproval(Base):
    __tablename__ = "plan_approvals"

    approval_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=False)
    action = Column(String(50), nullable=False)  # SUBMITTED, APPROVED, REVISION_REQUESTED, REJECTED
    actor_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    actor_name = Column(String(100), nullable=True)
    actor_role = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    plan = relationship("MaintenancePlan", back_populates="approvals")

    def __repr__(self):
        return f"<PlanApproval(approval_id={self.approval_id}, plan_id={self.plan_id}, action='{self.action}')>"

class PlanChange(Base):
    __tablename__ = "plan_changes"

    change_id = Column(Integer, primary_key=True, index=True)
    base_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=False)
    new_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=False)
    event_type = Column(String(100), nullable=False)  # e.g. "CRITICAL_SIGNAL_FAILURE"
    tasks_moved_count = Column(Integer, default=0)
    tasks_combined_count = Column(Integer, default=0)
    blocks_cancelled_count = Column(Integer, default=0)
    blocks_created_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, server_default=func.now())

    base_plan = relationship("MaintenancePlan", foreign_keys=[base_plan_id])
    new_plan = relationship("MaintenancePlan", foreign_keys=[new_plan_id])

    def __repr__(self):
        return f"<PlanChange(change_id={self.change_id}, base={self.base_plan_id}, new={self.new_plan_id})>"