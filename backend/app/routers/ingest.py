from fastapi import APIRouter, HTTPException, Depends
from schemas import IngestRequest, IngestResponse

from sqlalchemy.orm import Session
from database import get_db
from services.ingestion import ingest

router = APIRouter(tags=["ingestion"])

@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    request: IngestRequest,
    db: Session = Depends(get_db)
    ):
    try:
        #Call the ingest function from the services
        document = ingest(request.source_type, request.source, db)

        return IngestResponse(
            document_id=document.id,
            source_name=document.source_name,
            status=document.status,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
                          