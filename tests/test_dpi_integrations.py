import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_bhashini_samples():
    """Verify Bhashini pre-recorded voice samples endpoint."""
    response = client.get("/api/bhashini/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 2
    assert any(s["language"] == "hi" for s in data["samples"])
    assert any(s["language"] == "ta" for s in data["samples"])
    assert "data_source" in data
    assert "Bhashini" in data["data_source"]

def test_bhashini_asr_mock_sample():
    """Verify Bhashini ASR transcription on Hindi voice sample."""
    response = client.post("/api/bhashini/asr", json={
        "sample_id": "sample-hi-01",
        "language": "hi"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "पटरी पर दरार देखी गई" in data["recognized_text"]
    assert "Rail crack" in data["english_translation"]
    assert data["language"] == "hi"

def test_bhashini_tts_synthesis():
    """Verify Bhashini Text-to-Speech synthesis."""
    response = client.post("/api/bhashini/tts", json={
        "text": "पटरी पर कार्य पूरा हुआ",
        "language": "hi"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "audio_base64" in data
    assert data["speech_synthesis_locale"] == "hi-IN"

def test_bhashini_safety_checklist():
    """Verify regional safety checklist instructions."""
    res_hi = client.get("/api/bhashini/checklist?language=hi")
    assert res_hi.status_code == 200
    assert len(res_hi.json()["items"]) >= 5

    res_ta = client.get("/api/bhashini/checklist?language=ta")
    assert res_ta.status_code == 200
    assert len(res_ta.json()["items"]) >= 5

def test_apisetu_registered_operators():
    """Verify API Setu registered operators list."""
    response = client.get("/api/apisetu/operators")
    assert response.status_code == 200
    data = response.json()
    assert "operators" in data
    assert len(data["operators"]) >= 3
    assert "API Setu" in data["data_source"]

def test_apisetu_verify_operator():
    """Verify API Setu heavy machinery operator credential check."""
    response = client.post("/api/apisetu/verify-operator", json={
        "operator_id": 1,
        "machinery_type": "Track Tamping Machine"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is True
    assert "Verified via API Setu (Ministry of Road Transport & Highways / Railway Board Register)" in data["verification_badge"]
    assert data["operator_name"] == "Ravi Sharma"
    assert "license_number" in data
    assert "certificate_id" in data
    assert "digital_signature_hash" in data

def test_ogd_metadata_endpoint():
    """Verify data.gov.in Open Government Data schema mapping endpoint."""
    response = client.get("/api/data/ogd-metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE_ALIGNED"
    assert "https://data.gov.in" in data["portal_url"]
    assert data["data_source"] == "Aligned with OGD Platform India (data.gov.in)"

def test_ogd_corridors_and_trains_schema():
    """Verify OGD aligned fields on corridors and trains endpoints."""
    corridors_res = client.get("/api/corridors")
    assert corridors_res.status_code == 200
    corridors = corridors_res.json()
    assert len(corridors) > 0
    c = corridors[0]
    assert "data_source" in c
    assert c["data_source"] == "Aligned with OGD Platform India (data.gov.in)"
    assert "start_station_code" in c
    assert "gmt_density" in c
    assert len(c["sections"]) > 0
    assert "data_source" in c["sections"][0]
    assert "gmt_density" in c["sections"][0]

    trains_res = client.get("/api/trains")
    assert trains_res.status_code == 200
    trains = trains_res.json()
    assert len(trains) > 0
    tr = trains[0]
    assert "data_source" in tr
    assert tr["data_source"] == "Aligned with OGD Platform India (data.gov.in)"
    assert "origin_station_code" in tr
