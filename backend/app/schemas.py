from pydantic import BaseModel
from datetime import datetime

class IngestRequest(BaseModel):
    source_type: str
    source: str

class IngestResponse(BaseModel):
    document_id: str
    source_name: str
    status: str

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class SourceChunk(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    content: str
    rrf_score: float

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]

#Documents schema

class DocumentResponse(BaseModel):
    document_id: str
    source_type: str
    source_name: str
    status: str
    created_at: datetime