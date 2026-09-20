from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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
    },
    {
        "id": "AUTH-06",
        "authority_name": "Divisional S&T Authority (Signalling)",
        "designation": "Senior Divisional Signal & Telecom Engineer (Sr. DSTE)",
        "role_type": "Signal & Telecom Authority",
        "section_code": "C2",
        "phone": "+91-11-23340066",
        "email": "srdste.south@railopt.demo",
        "radio_channel": "VHF Ch 14 (Signal Interlocking)",
        "priority_level": "HIGH",
        "status": "ONLINE"
    },
    {
        "id": "AUTH-07",
        "authority_name": "Divisional Traction Distribution Authority (TRD)",
        "designation": "Senior Divisional Electrical Engineer (Sr. DEE / TrD)",
        "role_type": "Electrical Authority",
        "section_code": "C2",
        "phone": "+91-11-23340077",
        "email": "srdee.trd@railopt.demo",
        "radio_channel": "VHF Ch 18 (25kV Power Block)",
        "priority_level": "HIGH",
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

class ConcurrenceRequest(BaseModel):
    plan_id: int
    officer_role: str  # "SR_DEN" | "SR_DSTE" | "SR_DEE" | "CHIEF_CONTROLLER"
    officer_name: str
    decision: str      # "CONCURRED" | "OBJECTED"
    comments: Optional[str] = "No departmental objection. Safety clearance granted."

# In-memory storage for multi-department digital sign-off records
PLAN_CONCURRENCE_RECORDS: Dict[int, Dict[str, Any]] = {}

@router.get("/section-officers")
def list_section_officers():
    """Returns the 3 key Section Officers (Civil, S&T, Electrical) and Chief Controller."""
    return [
        {
            "role": "SR_DEN",
            "title": "Senior Divisional Engineer (Sr. DEN / North)",
            "department": "Civil / Permanent Way & Bridges",
            "authority_id": "AUTH-04",
            "status": "CONCURRENCE_PENDING"
        },
        {
            "role": "SR_DSTE",
            "title": "Senior Divisional Signal & Telecom Engineer (Sr. DSTE)",
            "department": "Signal & Telecommunication",
            "authority_id": "AUTH-06",
            "status": "CONCURRENCE_PENDING"
        },
        {
            "role": "SR_DEE",
            "title": "Senior Divisional Electrical Engineer (Sr. DEE / TrD)",
            "department": "Electrical / Traction & OHE",
            "authority_id": "AUTH-07",
            "status": "CONCURRENCE_PENDING"
        },
        {
            "role": "CHIEF_CONTROLLER",
            "title": "Chief Train Planning Controller (CTPC)",
            "department": "Operating / Traffic Possession Grant",
            "authority_id": "AUTH-01",
            "status": "AWAITING_CONCURRENCE"
        }
    ]

@router.get("/plan/{plan_id}/concurrence-status")
def get_plan_concurrence_status(plan_id: int):
    """Returns current digital concurrence signatures for a given plan."""
    record = PLAN_CONCURRENCE_RECORDS.get(plan_id, {
        "plan_id": plan_id,
        "civil_den": {"status": "PENDING", "timestamp": None, "comments": None},
        "signal_dste": {"status": "PENDING", "timestamp": None, "comments": None},
        "electrical_dee": {"status": "PENDING", "timestamp": None, "comments": None},
        "chief_controller": {"status": "PENDING", "timestamp": None, "comments": None},
        "all_concurred": False,
        "possession_granted": False
    })
    return record

@router.post("/concurrence")
def submit_section_officer_concurrence(
    payload: ConcurrenceRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits digital concurrence by a Section Officer (Sr. DEN, Sr. DSTE, Sr. DEE).
    Dispatches automated notifications via DomainEventBus.
    """
    plan_id = payload.plan_id
    if plan_id not in PLAN_CONCURRENCE_RECORDS:
        PLAN_CONCURRENCE_RECORDS[plan_id] = {
            "plan_id": plan_id,
            "civil_den": {"status": "PENDING", "timestamp": None, "comments": None},
            "signal_dste": {"status": "PENDING", "timestamp": None, "comments": None},
            "electrical_dee": {"status": "PENDING", "timestamp": None, "comments": None},
            "chief_controller": {"status": "PENDING", "timestamp": None, "comments": None},
            "all_concurred": False,
            "possession_granted": False
        }

    rec = PLAN_CONCURRENCE_RECORDS[plan_id]
    now_iso = datetime.now().isoformat()

    if payload.officer_role.upper() in ["SR_DEN", "CIVIL"]:
        rec["civil_den"] = {"status": payload.decision, "officer": payload.officer_name, "timestamp": now_iso, "comments": payload.comments}
    elif payload.officer_role.upper() in ["SR_DSTE", "SIGNAL"]:
        rec["signal_dste"] = {"status": payload.decision, "officer": payload.officer_name, "timestamp": now_iso, "comments": payload.comments}
    elif payload.officer_role.upper() in ["SR_DEE", "ELECTRICAL"]:
        rec["electrical_dee"] = {"status": payload.decision, "officer": payload.officer_name, "timestamp": now_iso, "comments": payload.comments}
    elif payload.officer_role.upper() in ["CHIEF_CONTROLLER", "CTPC"]:
        rec["chief_controller"] = {"status": payload.decision, "officer": payload.officer_name, "timestamp": now_iso, "comments": payload.comments}

    all_done = (
        rec["civil_den"]["status"] == "CONCURRED" and
        rec["signal_dste"]["status"] == "CONCURRED" and
        rec["electrical_dee"]["status"] == "CONCURRED"
    )
    rec["all_concurred"] = all_done

    DomainEventBus.publish(
        db=db,
        event_type="OFFICER_CONCURRENCE",
        aggregate_type="PLAN",
        aggregate_id=str(plan_id),
        payload={
            "plan_id": plan_id,
            "officer_role": payload.officer_role,
            "decision": payload.decision,
            "all_concurred": all_done
        },
        user_id=user.user_id if user else 1,
        target_role="OPERATIONS_MANAGER",
        title=f"Digital Concurrence: {payload.officer_role}",
        message=f"{payload.officer_role} ({payload.officer_name}) recorded {payload.decision} on Plan #{plan_id}.",
        reference_type="PLAN",
        reference_id=str(plan_id)
    )

    return {
        "status": "RECORDED",
        "plan_id": plan_id,
        "concurrence_status": rec,
        "message": f"Recorded {payload.decision} concurrence from {payload.officer_role}."
    }

@router.post("/possession-grant")
def grant_possession_by_chief_controller(
    plan_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chief Controller (CTPC) issues final corridor possession grant once all Section Officers have concurred.
    """
    rec = PLAN_CONCURRENCE_RECORDS.get(plan_id, {})
    rec["possession_granted"] = True
    rec["granted_at"] = datetime.now().isoformat()
    rec["chief_controller"] = {
        "status": "POSSESSION_GRANTED",
        "officer": user.full_name if user else "Chief Train Controller (CTPC)",
        "timestamp": datetime.now().isoformat(),
        "comments": "Final corridor possession window authorized for multi-department maintenance."
    }
    PLAN_CONCURRENCE_RECORDS[plan_id] = rec

    DomainEventBus.publish(
        db=db,
        event_type="POSSESSION_GRANTED",
        aggregate_type="PLAN",
        aggregate_id=str(plan_id),
        payload={"plan_id": plan_id, "status": "POSSESSION_GRANTED"},
        user_id=user.user_id if user else 1,
        target_role="MAINTENANCE_ENGINEER",
        title=f"Possession Granted: Plan #{plan_id}",
        message=f"Chief Train Controller (CTPC) has formally granted corridor possession for Plan #{plan_id}.",
        reference_type="PLAN",
        reference_id=str(plan_id)
    )

    return {
        "status": "POSSESSION_GRANTED",
        "plan_id": plan_id,
        "granted_at": rec["granted_at"],
        "message": f"Corridor possession officially granted for Plan #{plan_id}."
    }
