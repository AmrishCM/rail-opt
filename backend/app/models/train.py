from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class TrainType(str, enum.Enum):
    EXPRESS = "EXPRESS"
    PASSENGER = "PASSENGER"
    SUBURBAN = "SUBURBAN"
    FREIGHT = "FREIGHT"
    SPECIAL = "SPECIAL"

class TrainPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Train(Base):
    __tablename__ = "trains"

    train_id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), nullable=False, unique=True)
    train_type = Column(Enum(TrainType), nullable=False)
    priority = Column(Enum(TrainPriority), default=TrainPriority.MEDIUM)
    # Open Government Data (data.gov.in) Schema Alignment
    origin_station_code = Column(String(10), nullable=True)        # e.g., NDLS, ADI, MAS, CSMT
    destination_station_code = Column(String(10), nullable=True)   # e.g., CNB, BRC, ED, HWH
    ogd_train_id = Column(String(30), nullable=True)               # Official IR OGD dataset ID
    data_source = Column(String(100), default="Aligned with OGD Platform India (data.gov.in)")
    max_speed = Column(Integer, nullable=True)  # km/h
    capacity = Column(Integer, nullable=True)  # passengers or cargo weight
    current_status = Column(String(50), default="AVAILABLE")  # AVAILABLE, IN_SERVICE, MAINTENANCE, etc.
    meta_data = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    movements = relationship("TrainMovement", back_populates="train", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Train(train_id={self.train_id}, train_number='{self.train_number}', type={self.train_type})>"

class TrainMovement(Base):
    __tablename__ = "train_movements"

    movement_id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"), nullable=False)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    # Open Government Data (data.gov.in) Schema Alignment
    station_code = Column(String(10), nullable=True)  # Timetable stop station code
    chainage_km = Column(Float, nullable=True)        # Section chainage mark
    platform_no = Column(String(10), nullable=True)   # Station platform
    data_source = Column(String(100), default="Aligned with OGD Platform India (data.gov.in)")
    arrival_time = Column(DateTime, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    scheduled_duration = Column(Integer, nullable=True)  # minutes
    actual_duration = Column(Integer, nullable=True)  # minutes
    delay_minutes = Column(Integer, default=0)
    forecast_status = Column(String(50), default="ON_TIME")  # ON_TIME, DELAYED, EARLY, CANCELLED
    meta_data = Column(Text, nullable=True)  # JSON metadata

    # Relationships
    train = relationship("Train", back_populates="movements")
    corridor = relationship("Corridor", back_populates="train_movements")
    section = relationship("Section", back_populates="train_movements")

    def __repr__(self):
        return f"<TrainMovement(movement_id={self.movement_id}, train_id={self.train_id}, section_id={self.section_id})>"