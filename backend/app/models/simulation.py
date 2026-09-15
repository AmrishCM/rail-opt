from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class SimulationStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    simulation_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.plan_id"), nullable=False)
    status = Column(Enum(SimulationStatus), default=SimulationStatus.PENDING)
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    random_seed = Column(Integer, nullable=True)  # For reproducible simulations
    parameters = Column(Text, nullable=True)  # JSON simulation parameters

    # Results
    asset_availability_percent = Column(Float, nullable=True)
    total_train_delay_minutes = Column(Integer, nullable=True)
    total_block_hours = Column(Float, nullable=True)
    completed_tasks_count = Column(Integer, nullable=True)
    deferred_tasks_count = Column(Integer, nullable=True)
    conflicts_count = Column(Integer, nullable=True)
    average_block_utilization = Column(Float, nullable=True)
    coordination_events_count = Column(Integer, nullable=True)

    # Summary
    success = Column(Boolean, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    plan = relationship("MaintenancePlan")
    events = relationship("SimulationEvent", back_populates="simulation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SimulationRun(simulation_id={self.simulation_id}, plan_id={self.plan_id}, status={self.status})>"

class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    event_id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulation_runs.simulation_id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # TRAIN_DEPARTURE, TRAIN_ARRIVAL, MAINTENANCE_START, etc.
    timestamp = Column(DateTime, nullable=False)
    entity_id = Column(Integer, nullable=True)  # References train_id, task_id, etc.
    entity_type = Column(String(50), nullable=True)  # TRAIN, TASK, BLOCK, etc.
    description = Column(Text, nullable=True)
    impact_minutes = Column(Integer, nullable=True)  # Delay impact in minutes
    meta_data = Column(Text, nullable=True)  # JSON additional data

    # Relationships
    simulation = relationship("SimulationRun", back_populates="events")

    def __repr__(self):
        return f"<SimulationEvent(event_id={self.event_id}, simulation_id={self.simulation_id}, type='{self.event_type}', timestamp='{self.timestamp}')>"