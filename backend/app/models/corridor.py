from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base

class Corridor(Base):
    __tablename__ = "corridors"

    corridor_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    start_station = Column(String(100), nullable=False)
    end_station = Column(String(100), nullable=False)
    traffic_level = Column(Integer, default=1)  # 1-5 scale
    route_capacity = Column(Integer, nullable=True)  # trains per hour
    restrictions = Column(Text, nullable=True)  # JSON
    meta_data = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    sections = relationship("Section", back_populates="corridor", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="corridor")
    block_windows = relationship("BlockWindow", back_populates="corridor")
    train_movements = relationship("TrainMovement", back_populates="corridor")

    def __repr__(self):
        return f"<Corridor(corridor_id={self.corridor_id}, name='{self.name}')>"

class Section(Base):
    __tablename__ = "sections"

    section_id = Column(Integer, primary_key=True, index=True)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=False)
    name = Column(String(100), nullable=False)
    section_number = Column(Integer, nullable=False)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    length_km = Column(Float, nullable=False)
    max_speed = Column(Integer, nullable=True)  # km/h
    gradient = Column(Float, nullable=True)  # percentage
    curvature = Column(Text, nullable=True)  # JSON for curve data
    maintenance_complexity = Column(Integer, default=1)  # 1-5 scale
    meta_data = Column(Text, nullable=True)  # JSON metadata

    # Relationships
    corridor = relationship("Corridor", back_populates="sections")
    block_windows = relationship("BlockWindow", back_populates="section")
    train_movements = relationship("TrainMovement", back_populates="section")

    def __repr__(self):
        return f"<Section(section_id={self.section_id}, corridor_id={self.corridor_id}, name='{self.name}')>"