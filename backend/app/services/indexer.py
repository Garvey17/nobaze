from uuid import UUID
from pinecone import Pinecone
from sqlalchemy.orm import Session
from config import settings
from chunker import Chunk

#Pinecone client init
pc = Pinecone(api_key=settings.pinecone_api_key)

index = pc.index(settings.pinecone_index_name)

def index_document(document_id: UUID, chunks: list[dict], db: Session) -> None:
    try:
        #Create Chunk oRM objects
        chunk_rows = [
            Chunk(
                id=chunk["id"],
                document_id=document_id,
                content=chunk["content"],
                chunk_index=chunk["chunk_index"],
                token_count=chunk["token_count"],
            )
            for chunk in chunks
        ]
        #Bulk insertion
        db.bulk_save_objects(chunk_rows)

        #Prepare Pinecone vectors

        vectors = [
            {
                "id": str(chunk["id"]),
                "values": chunk["embedding"],
                "metadata": {
                    "document_id": str(document_id),
                    "chunk_index": chunk["chunk_index"],
                    "content": chunk["content"]
                }
            }
            for chunk in chunks
        ] 

        #upsert into pinecone
        index.upsert(vectors=vectors)

        #Commit Postgress transaction
        db.commit
    except Exception:
        db.rollback()
        raise
