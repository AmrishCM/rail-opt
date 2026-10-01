from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from ...services.apisetu_service import apisetu_service

router = APIRouter()

class VerifyOperatorRequest(BaseModel):
    operator_id: Optional[int] = Field(None, description="Operator user ID or internal registry ID")
    license_number: Optional[str] = Field(None, description="Driving License number (e.g. DL-0420180098421)")
    operator_name: Optional[str] = Field(None, description="Full name of machinery operator / engineer")
    machinery_type: Optional[str] = Field("Track Tamping Machine", description="Machinery type: Track Tamping Machine, Tower Wagon, etc.")

@router.get("/operators")
def list_registered_operators():
    """
    Returns registered heavy machinery operators with MoRTH Driving Licenses
    and Railway Board Competency Certifications.
    """
    return {
        "operators": apisetu_service.get_registered_operators(),
        "data_source": "API Setu Sandbox (DPI / Digital India - Ministry of Electronics & IT)"
    }

@router.post("/verify-operator")
def verify_operator_competency(req: VerifyOperatorRequest):
    """
    Simulates real-time API Setu query to Ministry of Road Transport & Highways
    (Sarathi DL Register) and Railway Board Machinery Operator Competency Register.
    """
    result = apisetu_service.verify_operator_competency(
        operator_id=req.operator_id,
        license_number=req.license_number,
        operator_name=req.operator_name,
        machinery_type=req.machinery_type
    )
    return result
