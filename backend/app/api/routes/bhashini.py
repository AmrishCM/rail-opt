from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from ...services.bhashini_service import bhashini_service

router = APIRouter()

class AsrRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="Base64-encoded recorded audio bytes")
    sample_id: Optional[str] = Field(None, description="Identifier for pre-recorded mock voice sample")
    language: Optional[str] = Field("hi", description="Language code: 'hi' for Hindi, 'ta' for Tamil")

class TtsRequest(BaseModel):
    text: str = Field(..., description="Text string to synthesize to regional speech")
    language: Optional[str] = Field("hi", description="Language code: 'hi', 'ta', or 'en'")

@router.get("/samples")
def get_bhashini_samples():
    """
    Returns pre-recorded Indian Railways field defect audio samples (Hindi & Tamil)
    for offline or simulated ASR testing in the Field Inspector PWA.
    """
    return {
        "samples": bhashini_service.get_samples(),
        "data_source": "Bhashini AI (DPI / MeitY - National Language Translation Mission)"
    }

@router.post("/asr")
def run_automatic_speech_recognition(req: AsrRequest):
    """
    Transcribes spoken voice audio (Hindi or Tamil) into regional text
    and generates instant operational English translation.
    """
    result = bhashini_service.transcribe_speech(
        audio_base64=req.audio_base64,
        sample_id=req.sample_id,
        language=req.language or "hi"
    )
    return result

@router.post("/tts")
def run_text_to_speech(req: TtsRequest):
    """
    Synthesizes regional speech (Hindi, Tamil, English) for safety checklists
    and operational instructions.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return bhashini_service.synthesize_speech(
        text=req.text,
        language=req.language or "hi"
    )

@router.get("/checklist")
def get_safety_checklist(language: str = "hi"):
    """
    Returns official Indian Railways Pre-Possession Safety Checklist
    in specified regional language (hi / ta / en).
    """
    items = bhashini_service.get_safety_checklist(language=language)
    return {
        "language": language,
        "items": items,
        "data_source": "Bhashini AI (DPI / MeitY - National Language Translation Mission)"
    }
