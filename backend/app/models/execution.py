import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base

class ExecutionStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class ExecutionRecord(Base):
    __tablename__ = "execution_records"

    record_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("plan_assignments.assignment_id"), nullable=False)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.task_id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.NOT_STARTED)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    completion_note = Column(Text, nullable=True)
    issue_encountered = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    evidence_items = relationship("FieldEvidence", back_populates="execution_record", cascade="all, delete-orphan")
    task = relationship("MaintenanceTask")
    assignment = relationship("PlanAssignment")
    inspector = relationship("User")

    def __repr__(self):
        return f"<ExecutionRecord(id={self.record_id}, task_id={self.task_id}, status={self.status})>"

class FieldEvidence(Base):
    __tablename__ = "field_evidence"

    evidence_id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("execution_records.record_id"), nullable=True)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.task_id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="image/jpeg")  # image/jpeg, application/pdf
    file_data = Column(Text, nullable=True)  # Base64 string or file path
    comments = Column(Text, nullable=True)
    uploaded_by = Column(String(100), nullable=True)  # Employee ID or User name
    uploaded_at = Column(DateTime, server_default=func.now())

    execution_record = relationship("ExecutionRecord", back_populates="evidence_items")
    task = relationship("MaintenanceTask")

    def __repr__(self):
        return f"<FieldEvidence(id={self.evidence_id}, file='{self.file_name}', task_id={self.task_id})>"

class ExecutionIssue(Base):
    __tablename__ = "execution_issues"

    issue_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("plan_assignments.assignment_id"), nullable=True)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.task_id"), nullable=False)
    issue_category = Column(String(100), nullable=False)  # Unexpected damage, Work larger, Equipment, Safety, etc.
    severity = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    is_critical = Column(Boolean, default=False)
    description = Column(Text, nullable=False)
    photo_evidence = Column(Text, nullable=True)
    reported_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    task = relationship("MaintenanceTask")

    def __repr__(self):
        return f"<ExecutionIssue(id={self.issue_id}, category='{self.issue_category}', critical={self.is_critical})>"

class DomainEvent(Base):
    __tablename__ = "domain_events"

    event_id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # ISSUE_CREATED, PLAN_APPROVED, etc.
    aggregate_type = Column(String(50), nullable=False)  # ISSUE, PLAN, TASK, CRITICAL_EVENT
    aggregate_id = Column(String(100), nullable=False, index=True)
    payload = Column(Text, nullable=True)  # JSON payload
    user_id = Column(String(100), nullable=True)
    target_role = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    def __repr__(self):
        return f"<DomainEvent(id={self.event_id}, type='{self.event_type}', agg='{self.aggregate_type}:{self.aggregate_id}')>"

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Specific recipient user or null
    target_role = Column(String(50), nullable=True)  # Role name if targeted to role
    event_type = Column(String(100), nullable=True)  # Domain event type that triggered notification
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    reference_type = Column(String(50), nullable=True)  # ISSUE, PLAN, TASK, CRITICAL_EVENT
    reference_id = Column(String(100), nullable=True)  # e.g. IR-2026-0042, PLAN-2026-0042
    notification_type = Column(String(50), default="INFO")  # INFO, WARNING, CRITICAL, APPROVAL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

    def __repr__(self):
        return f"<Notification(id={self.notification_id}, title='{self.title}', read={self.is_read})>"
