from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ...db.session import get_db
from ...models.auth import User, to_canonical_role
from ...models.scenario import AuditLog
from ...utils.security import get_current_user, require_role
from ...services.event_bus import DomainEventBus

router = APIRouter()

class AuthorityContact(BaseModel):
    id: str
    authority_name: str
    designation: str
    role_type: str
    section_code: str
    phone: str
    email: str
    radio_channel: Optional[str] = None
    priority_level: str
    status: str

class EscalateContactRequest(BaseModel):
    contact_id: str
    issue_reference: Optional[str] = None
    channel: str  # "CALL" | "EMAIL" | "MESSAGE" | "ESCALATE"
    message: str

# Deterministic official railway divisional authorities for RailOpt-AI
CONFIGURED_AUTHORITIES = [
    {
        "id": "AUTH-01",
        "authority_name": "Chief Controller / Railway Control Board",
        "designation": "Chief Train Controller (CTPC)",
        "role_type": "Railway Control",
        "section_code": "ALL",
        "phone": "+91-11-23340000",
        "email": "control.delhi@railopt.demo",
        "radio_channel": "VHF Ch 12 (Central Control)",
        "priority_level": "CRITICAL",
        "status": "ONLINE"
    },
    {
        "id": "AUTH-02",
        "authority_name": "Section Controller (Kanpur Line)",
        "designation": "Section Controller (Operating)",
        "role_type": "Section Controller",
        "section_code": "C2-02",
        "phone": "+91-11-23340022",
        "email": "section.c2@railopt.demo",
        "radio_channel": "VHF Ch 08 (Section Operations)",
        "priority_level": "HIGH",
        "status": "ONLINE"
    },
    {
        "id": "AUTH-03",
        "authority_name": "Salem / Erode Station Master",
        "designation": "Station Master in Charge",
        "role_type": "Station Master",
        "section_code": "C2-01",
        "phone": "+91-11-23340033",
        "email": "stationmaster.erode@railopt.demo",
        "radio_channel": "VHF Ch 04 (Station Master)",
        "priority_level": "MEDIUM",
        "status": "ONLINE"
    },
    {
        "id": "AUTH-04",
        "authority_name": "Divisional Engineering Authority (Civil)",
        "designation": "Senior Divisional Engineer (Sr. DEN / North)",
        "role_type": "Engineering Authority",
        "section_code": "C2",
        "phone": "+91-11-23340044",
        "email": "srden.north@railopt.demo",
        "radio_channel": "VHF Ch 16 (Track Safety)",
        "priority_level": "HIGH",
        "status": "ONLINE"
    },
    {
        "id": "AUTH-05",
        "authority_name": "Railway Safety & Interlocking Directorate",
        "designation": "Divisional Safety Officer (DSO)",
        "role_type": "Safety Authority",
        "section_code": "ALL",
        "phone": "+91-11-23340055",
        "email": "safety.division@railopt.demo",
        "radio_channel": "VHF Ch 01 (Emergency Alert)",
        "priority_level": "CRITICAL",
        "status": "ONLINE"
    }
]

@router.get("", response_model=List[AuthorityContact])
def list_authorities(
    user: User = Depends(require_role(["MANAGER", "ADMIN", "ENGINEER"])),
    db: Session = Depends(get_db)
):
    """Returns configured railway authorities for communication and escalation."""
    return CONFIGURED_AUTHORITIES

@router.post("/escalate")
def escalate_to_authority(
    payload: EscalateContactRequest,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Records an operational communication/escalation action with audit trail.
    Only Managers and Admins can trigger official railway authority escalations.
    """
    contact = next((c for c in CONFIGURED_AUTHORITIES if c["id"] == payload.contact_id), None)
    if not contact:
        raise HTTPException(status_code=404, detail="Configured authority contact not found")

    audit = AuditLog(
        action=f"AUTHORITY_{payload.channel.upper()}",
        entity_type="AUTHORITY",
        entity_id=payload.contact_id,
        user_id=user.employee_id,
        details=f"{user.full_name} communicated via {payload.channel} to {contact['authority_name']}. Message: {payload.message} (Ref: {payload.issue_reference or 'General Operations'})"
    )
    db.add(audit)
    db.commit()

    DomainEventBus.publish(
        db=db,
        event_type="AUTHORITY_ESCALATION",
        aggregate_type="AUTHORITY",
        aggregate_id=payload.contact_id,
        payload={
            "contact_id": payload.contact_id,
            "authority_name": contact["authority_name"],
            "channel": payload.channel,
            "message": payload.message,
            "sender": user.full_name
        },
        user_id=user.user_id,
        target_role="OPERATIONS_MANAGER",
        title=f"Authority {payload.channel}: {contact['role_type']}",
        message=f"Dispatched {payload.channel.lower()} to {contact['authority_name']}: {payload.message[:60]}...",
        reference_type="AUTHORITY",
        reference_id=payload.contact_id
    )

    return {
        "status": "SENT",
        "contact_id": payload.contact_id,
        "authority_name": contact["authority_name"],
        "channel": payload.channel,
        "dispatched_at": datetime.now().isoformat(),
        "audit_recorded": True,
        "message": f"Dispatched {payload.channel.lower()} to {contact['authority_name']} successfully."
    }
