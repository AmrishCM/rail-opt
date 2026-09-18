"""
Mock Data API — Serves deterministic TMS/SMMS/TDMS/COA data to the frontend.
These endpoints simulate integration with real railway operational systems.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...services.mock_data.tms_provider import TMSProvider
from ...services.mock_data.smms_provider import SMMSProvider
from ...services.mock_data.tdms_provider import TDMSProvider
from ...services.mock_data.coa_provider import COAProvider
from ...services.mock_data.resource_provider import ResourceProvider
from ...services.state_machine import get_workflow_stages, get_replan_stages
from typing import Optional

router = APIRouter()


@router.get("/tms")
def get_tms_data():
    """TMS — Track Management System defects and overdue maintenance."""
    return TMSProvider.get_all()


@router.get("/smms")
def get_smms_data():
    """SMMS — Signalling Maintenance & Management System equipment defects."""
    return SMMSProvider.get_all()


@router.get("/tdms")
def get_tdms_data():
    """TDMS — Traction Distribution Management System OHE defects."""
    return TDMSProvider.get_all()


@router.get("/coa")
def get_coa_data():
    """COA — Control Office Application: timetable, freight, capacity, availability."""
    return COAProvider.get_all()


@router.get("/coa/timetable")
def get_timetable(section: Optional[str] = None):
    """Master train timetable, optionally filtered by section."""
    if section:
        return COAProvider.get_timetable_for_section(section)
    return COAProvider.get_timetable()


@router.get("/coa/freight")
def get_freight():
    """Goods train forecast."""
    return COAProvider.get_freight_forecast()


@router.get("/coa/capacity")
def get_capacity():
    """Sectional capacity data."""
    return COAProvider.get_sectional_capacity()


@router.get("/coa/availability")
def get_availability(section: Optional[str] = None):
    """Corridor block availability."""
    if section:
        return COAProvider.get_corridor_availability_for_section(section)
    return COAProvider.get_corridor_availability()


@router.get("/coa/conflicts")
def check_conflicts(section: str, block_start: str, block_end: str):
    """Check train conflicts for a proposed maintenance window."""
    return {
        "section": section,
        "proposed_window": f"{block_start} – {block_end}",
        "conflicts": COAProvider.check_train_conflict(section, block_start, block_end),
    }


@router.get("/resources")
def get_resources(department: Optional[str] = None, available_only: bool = False):
    """Available maintenance resources."""
    if department and available_only:
        return ResourceProvider.get_available_for_department(department)
    elif department:
        return ResourceProvider.get_by_department(department)
    elif available_only:
        return ResourceProvider.get_available()
    return ResourceProvider.get_all()


@router.get("/resources/teams")
def get_teams():
    """Engineering teams."""
    return ResourceProvider.get_engineering_teams()


@router.get("/workflow-stages")
def get_stages():
    """Issue workflow stages for UI rendering."""
    return {
        "main_stages": get_workflow_stages(),
        "replan_stages": get_replan_stages(),
    }


@router.get("/all")
def get_all_mock_data():
    """Complete mock dataset for system overview."""
    return {
        "tms": TMSProvider.get_all(),
        "smms": SMMSProvider.get_all(),
        "tdms": TDMSProvider.get_all(),
        "coa": COAProvider.get_all(),
        "resources": ResourceProvider.get_all(),
        "workflow_stages": get_workflow_stages(),
    }
