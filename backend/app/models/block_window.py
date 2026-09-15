from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class BlockType(str, enum.Enum):
    FULL_BLOCK = "FULL_BLOCK"
    PARTIAL_BLOCK = "PARTIAL_BLOCK"
    POWER_BLOCK = "POWER_BLOCK"
    TRAFFIC_BLOCK = "TRAFFIC_BLOCK"
    SIGNALLING_BLOCK = "SIGNALLING_BLOCK"
    COMBINED_BLOCK = "COMBINED_BLOCK"

class BlockStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"

class BlockWindow(Base):
    __tablename__ = "block_windows"

    block_id = Column(Integer, primary_key=True, index=True)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    block_type = Column(Enum(BlockType), nullable=False)
    traffic_level = Column(Integer, default=1)  # 1-5 scale during block
    restrictions = Column(Text, nullable=True)  # JSON
    eligible_departments = Column(Text, nullable=True)  # JSON array of department names
    status = Column(Enum(BlockStatus), default=BlockStatus.AVAILABLE)
    meta_data = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    corridor = relationship("Corridor", back_populates="block_windows")
    section = relationship("Section", back_populates="block_windows")
    plan_assignments = relationship("PlanAssignment", back_populates="block")

    def __repr__(self):
        return f"<BlockWindow(block_id={self.block_id}, corridor_id={self.corridor_id}, section_id={self.section_id}, start_time='{self.start_time}')>"