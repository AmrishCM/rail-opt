from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    scenario_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False)  # CRITICAL_DEFECT, CANCELLED_BLOCK, TRAIN_SURGE, CREW_UNAVAILABLE
    base_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=True)
    new_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=True)
    parameters = Column(Text, nullable=True)  # JSON parameters for the scenario event
    status = Column(String(50), default="CREATED")  # CREATED, EVALUATED, COMPLETED
    impact_summary = Column(Text, nullable=True)  # JSON comparison metrics
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    base_plan = relationship("MaintenancePlan", foreign_keys=[base_plan_id])
    new_plan = relationship("MaintenancePlan", foreign_keys=[new_plan_id])

    def __repr__(self):
        return f"<Scenario(scenario_id={self.scenario_id}, name='{self.name}', type='{self.event_type}')>"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)  # PLAN_OPTIMIZED, PLAN_APPROVED, SCENARIO_RUN, REPLAN_TRIGGERED
    entity_type = Column(String(50), nullable=False)  # PLAN, TASK, SCENARIO, ASSET
    entity_id = Column(String(100), nullable=True)
    user_id = Column(String(100), default="OPERATOR")
    details = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<AuditLog(log_id={self.log_id}, action='{self.action}', entity='{self.entity_type}:{self.entity_id}')>"
