from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.session import Base

class AssetType(str, enum.Enum):
    TRACK = "TRACK"
    SIGNAL = "SIGNAL"
    TRACTION = "TRACTION"
    LEVEL_CROSSING = "LEVEL_CROSSING"
    POINTS = "POINTS"
    BRIDGE = "BRIDGE"
    TELECOM = "TELECOM"
    OTHER = "OTHER"

class Asset(Base):
    __tablename__ = "assets"
    
    asset_id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(Enum(AssetType), nullable=False)
    department = Column(String(50), nullable=False)
    corridor_id = Column(Integer, ForeignKey("corridors.corridor_id"), nullable=True)
    location = Column(String(200), nullable=False)
    criticality = Column(Integer, nullable=False)  # 1-100 scale
    installation_date = Column(DateTime, nullable=True)
    operating_status = Column(String(50), default="OPERATIONAL")
    last_maintenance_date = Column(DateTime, nullable=True)
    next_due_date = Column(DateTime, nullable=True)
    meta_data = Column(Text, nullable=True)  # JSON metadata
    
    # Relationships
    corridor = relationship("Corridor", back_populates="assets")
    maintenance_tasks = relationship("MaintenanceTask", back_populates="asset")
    
    def __repr__(self):
        return f"<Asset(asset_id={self.asset_id}, type={self.asset_type}, location='{self.location}')>"
