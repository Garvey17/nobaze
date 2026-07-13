from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from schemas import IngestRequest, IngestResponse
import tempfile, os, shutil

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
            document_id=str(document.id),
            source_name=document.source_name,
            status=document.status,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/ingest/pdf-upload", response_model=IngestResponse)
async def ingest_pdf_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accept a PDF file upload from the browser, save it to a temp file,
    run it through the existing ingestion pipeline, and clean up.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are accepted.")

    # Write uploaded bytes to a named temp file that fitz can open
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        document = ingest("pdf", tmp_path, db)
        # Override the stored source_name with the original filename
        document.source_name = file.filename
        db.commit()
        db.refresh(document)

        return IngestResponse(
            document_id=str(document.id),
            source_name=document.source_name,
            status=document.status,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)