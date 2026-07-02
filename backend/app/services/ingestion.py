import fitz
import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from models import SourceType , DocumentStatus, Document
from services.chunker import chunk_text
from services.embedder import embed_chunks
from services.indexer import index_document
from database import get_db

filepath = "services/sources/test_source.pdf"

def extract_from_pdf(filepath: str) -> str:
    page_text_list =[] 
    document = fitz.open(filepath)
    #document is a list of pages and each page text has to be extracted

    for page in document:
        text = page.get_text()
        if text == "":
            continue
        else:
            page_text_list.append(text)
    
    return "\n\n".join(page_text_list)

def extract_from_url(url: str)-> str:
    """
    Fetch a webpage and extract text from <p> tags only
    """
    response = httpx.get(
        url,
        follow_redirects=True,
        timeout=30.0
    )
    response.raise_for_status()

    soup= BeautifulSoup(response.text, "html.parser")

    paragraphs = soup.find_all("p")

    text_parts = []

    for p in paragraphs:
        text = p.get_text(strip=True)
        if text:
            text_parts.append(text)
    
    return "\n\n".join(text_parts)


def extract_from_text(raw_text: str) -> str:
    """
    A passthrough fuction that validates that the text passed is a non-empty string and then return it
    """
    if not raw_text.strip():
        raise ValueError('Empty string passed to the text extractor')
    else:
        return raw_text
    


def ingest(source_type: str, source: str, db:Session) -> Document:

    #creating document row in postgress
    document = Document(
        source_type=SourceType(source_type),
        source_name=source,
        status = DocumentStatus.PENDING
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    try:

        #Processing
        document.status = DocumentStatus.PROCESSING
        db.commit()
        db.refresh(document)

        #extract text
        if source_type == SourceType.PDF.value:
            text = extract_from_pdf(source)
        elif source_type == SourceType.URL.value:
            text = extract_from_url(source)
        elif source_type == SourceType.TEXT.value:
            text = extract_from_text(source)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
        
        chunks = chunk_text(text, document_id=document.id)

        chunks_with_embeddings = embed_chunks(chunks)

        index_document(document.id, chunks_with_embeddings, db)

        document.status = DocumentStatus.COMPLETE
        db.commit()
        db.refresh(document)
        return document
    except Exception:
        document.status = DocumentStatus.FAILED
        db.commit()
        db.refresh(document)
        raise 

if __name__ == "__main__":

    db = next(get_db())
    try:
        doc = ingest(
            source_type="pdf",
            source=filepath,
            db=db
        )
        print(f"Ingestion complete status: {doc.status}")
    finally:
        db.close()