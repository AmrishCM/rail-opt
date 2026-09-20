import pytest
from app.services.mock_data.bdms_provider import BDMSProvider, get_bdms_defects
from app.services.spatial.linear_referencing import LinearReferencingService
from app.services.ingestion.unified_ingestion import UnifiedIngestionService

def test_bdms_provider_returns_bridge_defects():
    defects = get_bdms_defects()
    assert len(defects) >= 3
    assert any("Scour" in d["defect_type"] for d in defects)
    assert any(d["bridge_no"] == "BR-142" for d in defects)

def test_linear_referencing_parse_chainage():
    s, e = LinearReferencingService.parse_chainage("KM 42.8")
    assert s == 42.8
    assert e == 43.8

    s2, e2 = LinearReferencingService.parse_chainage("KM 120/400 - 130/200")
    assert s2 == 120.4
    assert e2 == 130.2

    s3, e3 = LinearReferencingService.parse_chainage("Section C2-02 (KM 44.5 - 47.0)")
    assert s3 == 44.5
    assert e3 == 47.0

def test_spatial_overlap_calculation():
    # Direct overlap
    res1 = LinearReferencingService.calculate_spatial_overlap(42.0, 45.0, 43.0, 46.0)
    assert res1["is_overlapping"] is True
    assert res1["direct_overlap_km"] == 2.0
    assert res1["overlap_start_km"] == 43.0
    assert res1["overlap_end_km"] == 45.0

    # No direct overlap but within 2.5km shadow buffer
    res2 = LinearReferencingService.calculate_spatial_overlap(40.0, 42.0, 43.5, 46.0, safety_buffer_km=2.0)
    assert res2["is_overlapping"] is False
    assert res2["is_shadow_candidate"] is True

def test_unified_ingestion_connectors_status():
    connectors = UnifiedIngestionService.get_connector_status()
    assert len(connectors) == 5
    codes = [c["code"] for c in connectors]
    assert "TMS" in codes
    assert "SMMS" in codes
    assert "TDMS" in codes
    assert "COA" in codes
    assert "BDMS" in codes
    for c in connectors:
        assert c["status"] == "ONLINE"
        assert c["latency_ms"] > 0

def test_unified_ingestion_and_harmonization():
    result = UnifiedIngestionService.ingest_and_harmonize(corridor_id=2)
    assert result["total_ingested"] >= 10
    assert result["department_counts"]["Track (TMS)"] >= 4
    assert result["department_counts"]["S&T (SMMS)"] >= 3
    assert result["department_counts"]["Traction (TDMS)"] >= 3
    assert result["department_counts"]["Bridges (BDMS)"] >= 2
    assert result["shadow_opportunities_detected"] >= 1

    # Verify linear referencing fields exist on all harmonized defects
    for d in result["harmonized_defects"]:
        assert "section_code" in d
        assert "track_id" in d
        assert "start_km" in d
        assert "end_km" in d
        assert "chainage_str" in d
        assert d["start_km"] <= d["end_km"]

def test_live_train_delay_and_goods_forecast():
    delays = UnifiedIngestionService.get_live_train_delay_stream()
    assert len(delays) >= 4
    assert any(d["train_number"] == "12671" for d in delays)

    goods = UnifiedIngestionService.get_goods_train_forecast()
    assert len(goods) >= 2
    assert any(g.get("priority") == "HIGH" for g in goods)
