from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base

class CriticalEvent(Base):
    __tablename__ = "critical_events"

    event_id = Column(Integer, primary_key=True, index=True)
    event_number = Column(String(50), unique=True, nullable=True, index=True)  # e.g. CE-2026-0001
    type = Column(String(100), nullable=False)  # CRITICAL_SIGNAL_FAILURE, RAIL_FRACTURE, OHE_BREAKDOWN
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=True)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=True)
    severity = Column(Integer, default=10, nullable=False)  # 1-10
    description = Column(Text, nullable=False)
    reported_by = Column(String(100), nullable=True)
    reported_at = Column(DateTime, default=func.now(), nullable=False)
    affected_plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=True)
    status = Column(String(50), default="OPEN")  # OPEN, IMPACT_ASSESSED, REPLAN_IN_PROGRESS, PLAN_REVISED, RESOLVED
    replan_required = Column(Boolean, default=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    asset = relationship("Asset")
    corridor = relationship("Corridor")
    section = relationship("Section")
    affected_plan = relationship("MaintenancePlan", foreign_keys=[affected_plan_id])

    def __repr__(self):
        return f"<CriticalEvent(id={self.event_id}, num={self.event_number}, type='{self.type}', status={self.status})>"
