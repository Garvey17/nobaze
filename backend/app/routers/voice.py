from fastapi import APIRouter, UploadFile, File, Depends
from app.services.voice import voice_answer
from database import get_db
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse


router = APIRouter(tags=["voice"])

@router.post("/voice")
async def voice_query(audio: UploadFile = File(...), db: Session = Depends(get_db)):

    audio_bytes = await audio.read()

    return StreamingResponse(
        voice_answer(audio_bytes, db),
        media_type="audio/mpeg"
    )