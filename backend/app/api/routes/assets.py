from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...db.session import get_db
from ...models.asset import Asset
from ...models.corridor import Corridor
from ...schemas.asset import AssetResponse, AssetCreate
from ...schemas.common import PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
def list_assets(
    corridor_id: Optional[int] = None,
    department: Optional[str] = None,
    asset_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)
    if corridor_id:
        query = query.filter(Asset.corridor_id == corridor_id)
    if department:
        query = query.filter(Asset.department == department)
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)

    total = query.count()
    assets = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in assets:
        corr_name = a.corridor.name if a.corridor else None
        items.append({
            "asset_id": a.asset_id,
            "asset_type": a.asset_type.value if hasattr(a.asset_type, "value") else str(a.asset_type),
            "department": a.department,
            "corridor_id": a.corridor_id,
            "corridor_name": corr_name,
            "location": a.location,
            "criticality": a.criticality,
            "operating_status": a.operating_status,
            "installation_date": a.installation_date.isoformat() if a.installation_date else None,
            "last_maintenance_date": a.last_maintenance_date.isoformat() if a.last_maintenance_date else None,
            "next_due_date": a.next_due_date.isoformat() if a.next_due_date else None,
            "meta_data": a.meta_data
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "dataset_type": "synthetic/demo"
    }

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {
        "asset_id": asset.asset_id,
        "asset_type": asset.asset_type.value if hasattr(asset.asset_type, "value") else str(asset.asset_type),
        "department": asset.department,
        "corridor_id": asset.corridor_id,
        "corridor_name": asset.corridor.name if asset.corridor else None,
        "location": asset.location,
        "criticality": asset.criticality,
        "operating_status": asset.operating_status,
        "installation_date": asset.installation_date,
        "last_maintenance_date": asset.last_maintenance_date,
        "next_due_date": asset.next_due_date,
        "meta_data": asset.meta_data
    }

@router.post("", response_model=AssetResponse)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)):
    new_asset = Asset(
        asset_type=payload.asset_type,
        department=payload.department,
        corridor_id=payload.corridor_id,
        location=payload.location,
        criticality=payload.criticality,
        operating_status=payload.operating_status
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return get_asset(new_asset.asset_id, db)
