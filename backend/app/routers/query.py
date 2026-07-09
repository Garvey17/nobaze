from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import QueryRequest, QueryResponse, SourceChunk
from services.generator import answer
from database import get_db

router = APIRouter(tags=["query"])

@router.post("/query", response_model = QueryResponse)
async def query_knowledge_base(request : QueryRequest, db: Session = Depends(get_db)):
    """
    api endpoint that hits the answer function from services
    """
    try:
        #note the aswer function returns {"answer":"....", "sources":{...chunks}}
        query_answer = answer(request.query, db)

        return QueryResponse(
            answer=query_answer["answer"],
            sources=[
                SourceChunk(
                    chunk_id=chunk["id"],
                    document_id=chunk["document_id"],
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    rrf_score=chunk["rrf_score"]
                )
                for chunk in query_answer["sources"]
            ]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=str(e)
        )