from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List, Dict, Any

from ...services.ingestion.unified_ingestion import UnifiedIngestionService
from ...services.spatial.linear_referencing import LinearReferencingService
from ...utils.security import get_current_user

router = APIRouter()

@router.get("/connectors")
def get_connectors_status():
    """
    Returns live connectivity status, ping latency, and protocol details for:
    TMS, SMMS, TDMS, COA, and BDMS REST API connectors.
    """
    return {
        "status": "OPERATIONAL",
        "connectors": UnifiedIngestionService.get_connector_status()
    }

@router.post("/sync")
def trigger_unified_sync(corridor_id: int = Query(2, description="Target corridor ID")):
    """
    Trigger automated multi-department ingestion and spatial harmonization pipeline.
    Standardizes linear referencing and detects cross-department spatial overlaps.
    """
    result = UnifiedIngestionService.ingest_and_harmonize(corridor_id=corridor_id)
    return {
        "message": f"Successfully ingested and harmonized {result['total_ingested']} records from TMS, SMMS, TDMS, and BDMS.",
        "data": result
    }

@router.get("/harmonized-defects")
def get_harmonized_defects(corridor_id: int = Query(2, description="Corridor ID")):
    """
    Returns standardized defects with Section, Line ID, Km/Chainage, and Track ID.
    """
    result = UnifiedIngestionService.ingest_and_harmonize(corridor_id=corridor_id)
    return result["harmonized_defects"]

@router.get("/spatial-clusters")
def get_spatial_clusters(corridor_id: int = Query(2, description="Corridor ID")):
    """
    Returns detected cross-department spatial clusters and shadowing opportunities.
    """
    result = UnifiedIngestionService.ingest_and_harmonize(corridor_id=corridor_id)
    return {
        "clusters_count": len(result["spatial_clusters"]),
        "shadow_clusters": [c for c in result["spatial_clusters"] if c["is_multi_department"]],
        "all_clusters": result["spatial_clusters"]
    }

@router.get("/live-feeds")
def get_live_feeds():
    """
    Returns real-time COA live train delay stream and dynamic freight/goods train forecasts.
    """
    return {
        "train_delay_stream": UnifiedIngestionService.get_live_train_delay_stream(),
        "goods_train_forecast": UnifiedIngestionService.get_goods_train_forecast()
    }
