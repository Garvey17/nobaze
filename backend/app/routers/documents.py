from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from app.schemas import DocumentResponse
from sqlalchemy.orm import Session
from models import Document
import logging

logging.basicConfig(
    level="INFO"
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["documents"])

@router.get('/documents', response_model=list[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    
    """
    queries postgress for list of documents in the database
    """
    try:
        documents = db.query(Document).all()
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    

@router.delete('/documents/{document_id}', status_code=204)
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    try:
        document = db.query(Document).filter_by(Document.id==document_id).first()

        if not document:
            logger.warning('Document does not exist')
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        db.delete(document)
        db.commit()
        logger.info(f'Delete operation successfully carried out on document with id:{document_id}')
    except Exception as e:
        logger.error(f'Something went wrong while trying to delete: {e}')


