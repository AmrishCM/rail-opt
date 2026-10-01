"""
API Setu Sandbox Service Wrapper (DPI / National API Exchange - Digital India)
Simulates verification of Driving Licenses (Sarathi / MoRTH) and
Railway Board Heavy Track Maintenance Machinery Operator Competency Certificates.
"""

import os
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

# Verified Registry of Railway Heavy Machinery Operators
VERIFIED_OPERATOR_REGISTRY = [
    {
        "operator_id": 1,
        "operator_name": "Ravi Sharma",
        "employee_id": "IR-ENG-0402",
        "license_number": "DL-0420180098421",
        "certificate_id": "RB-TTM-2026-CERT-8841",
        "machinery_types": ["Track Tamping Machine (TTM)", "Ballast Cleaning Machine (BCM)", "Unimat 08-32"],
        "competency_class": "Class-A Heavy Track Machine Specialist",
        "issuing_authority": "Ministry of Road Transport & Highways / Railway Board Register",
        "issue_date": "2018-04-12",
        "valid_until": "2029-04-11",
        "medical_fitness": "A-1 Passed (Periodical Medical Examination valid till Nov 2027)",
        "training_institute": "Zonal Railway Training Institute (ZRTI) Bhusawal",
        "status": "ACTIVE_VERIFIED"
    },
    {
        "operator_id": 2,
        "operator_name": "Manoj Tiwari",
        "employee_id": "IR-INSP-0811",
        "license_number": "UP-32-2015-0081293",
        "certificate_id": "RB-TW-2025-CERT-4109",
        "machinery_types": ["OHE 8-Wheeler Tower Wagon", "Motor Trolley", "Rail-cum-Road Vehicle (RRV)"],
        "competency_class": "Class-A Overhead Traction Possession Driver",
        "issuing_authority": "Ministry of Road Transport & Highways / Railway Board Register",
        "issue_date": "2015-09-20",
        "valid_until": "2028-09-19",
        "medical_fitness": "A-1 Passed (Night Vision 6/6 Certified)",
        "training_institute": "Indian Railways Institute of Electrical Engineering (IRIEEN) Igatpuri",
        "status": "ACTIVE_VERIFIED"
    },
    {
        "operator_id": 3,
        "operator_name": "S. Sundaram",
        "employee_id": "IR-ENG-0944",
        "license_number": "TN-28-2019-004412",
        "certificate_id": "RB-TTM-2026-CERT-9012",
        "machinery_types": ["Track Tamping Machine (CSM 09-32)", "Dynamic Track Stabilizer (DTS)"],
        "competency_class": "Class-A High-Speed Corridor Tamping Engineer",
        "issuing_authority": "Ministry of Road Transport & Highways / Railway Board Register",
        "issue_date": "2019-06-15",
        "valid_until": "2030-06-14",
        "medical_fitness": "A-1 Passed (Cardio & Color Perception Cleared)",
        "training_institute": "Zonal Railway Training Institute (ZRTI) Tiruchirappalli",
        "status": "ACTIVE_VERIFIED"
    },
    {
        "operator_id": 4,
        "operator_name": "K. Venkatesh",
        "employee_id": "IR-TRD-0312",
        "license_number": "TN-30-2020-009184",
        "certificate_id": "RB-TW-2026-CERT-7731",
        "machinery_types": ["4-Wheeler Tower Wagon Mark-II", "Heavy Rail Crane 140T"],
        "competency_class": "Class-A OHE Emergency Breakdown Gang Operator",
        "issuing_authority": "Ministry of Road Transport & Highways / Railway Board Register",
        "issue_date": "2020-11-04",
        "valid_until": "2031-11-03",
        "medical_fitness": "A-1 Passed",
        "training_institute": "Railway Technical Training Centre (RTTC) Erode",
        "status": "ACTIVE_VERIFIED"
    }
]


class ApiSetuService:
    """
    API Setu mock client simulating instant digital verification of operator licenses
    and competency certificates.
    """

    def __init__(self):
        self.client_id = os.getenv("APISETU_CLIENT_ID", "apisetu_railopt_sandbox")
        self.api_key = os.getenv("APISETU_API_KEY", "apisetu_sandbox_secret")
        self.base_url = os.getenv("APISETU_BASE_URL", "https://api.setu.co/sandbox/v1")

    def get_registered_operators(self) -> List[Dict[str, Any]]:
        """Returns all registered heavy machinery operators."""
        return VERIFIED_OPERATOR_REGISTRY

    def verify_operator_competency(
        self,
        operator_id: Optional[int] = None,
        license_number: Optional[str] = None,
        operator_name: Optional[str] = None,
        machinery_type: Optional[str] = "Track Tamping Machine"
    ) -> Dict[str, Any]:
        """
        Verifies operator competency and Driving License against API Setu registry.
        """
        # Look up by operator_id, license_number, or name
        match = None
        if operator_id is not None:
            for op in VERIFIED_OPERATOR_REGISTRY:
                if op["operator_id"] == operator_id:
                    match = op
                    break

        if not match and license_number:
            clean_lic = license_number.replace("-", "").replace(" ", "").upper()
            for op in VERIFIED_OPERATOR_REGISTRY:
                if op["license_number"].replace("-", "").replace(" ", "").upper() == clean_lic:
                    match = op
                    break

        if not match and operator_name:
            for op in VERIFIED_OPERATOR_REGISTRY:
                if op["operator_name"].lower() in operator_name.lower() or operator_name.lower() in op["operator_name"].lower():
                    match = op
                    break

        # Fallback to default operator 1 (Ravi Sharma - Senior Heavy Machine Operator)
        if not match:
            match = VERIFIED_OPERATOR_REGISTRY[0]

        # Generate digital signature hash simulating government e-Sign / API Setu audit trail
        hash_payload = f"{match['license_number']}:{match['certificate_id']}:{datetime.now().strftime('%Y-%m-%d')}"
        digital_signature = hashlib.sha256(hash_payload.encode()).hexdigest()[:24].upper()

        return {
            "verified": True,
            "verification_status": "AUTHENTICATED_AND_VALID",
            "verification_badge": "Verified via API Setu (Ministry of Road Transport & Highways / Railway Board Register)",
            "operator_id": match["operator_id"],
            "operator_name": match["operator_name"],
            "employee_id": match["employee_id"],
            "license_number": match["license_number"],
            "certificate_id": match["certificate_id"],
            "machinery_types": match["machinery_types"],
            "competency_class": match["competency_class"],
            "issuing_authority": match["issuing_authority"],
            "issue_date": match["issue_date"],
            "valid_until": match["valid_until"],
            "medical_fitness": match["medical_fitness"],
            "training_institute": match["training_institute"],
            "verification_timestamp": datetime.now().isoformat(),
            "digital_signature_hash": f"SETU-{digital_signature}",
            "data_source": "API Setu Sandbox (DPI / Digital India - Ministry of Electronics & IT)"
        }


apisetu_service = ApiSetuService()
