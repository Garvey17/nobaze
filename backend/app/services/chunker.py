from langchain_text_splitters import RecursiveCharacterTextSplitter
import uuid
from uuid import uuid4
from pydantic import BaseModel, Field

class Chunk(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    document_id: uuid.UUID
    content: str
    chunk_index: int
    token_count: int

def chunk_text(text: str, document_id: uuid.UUID)-> list[Chunk]:
    chunks: list[Chunk] = []
    text_spliiter = RecursiveCharacterTextSplitter(chunk_size = 512, chunk_overlap=64)

    texts: list[str] = text_spliiter.split_text(text)

    for text_chunk in texts:
        if text_chunk == "":
            continue
        chunk = Chunk(
            document_id=document_id,
            content=text_chunk,
            chunk_index=texts.index(text_chunk),
            token_count=len(text_chunk.split())
        )
        chunks.append(chunk)
    
    return chunks
    
    
