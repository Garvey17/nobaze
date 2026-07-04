from typing import Any
from rank_bm25 import BM25Okapi
from sqlalchemy.orm import Session
from models import Chunk

def tokenize(text: str) -> list[str]:
    """
    simple tokenizer that returns lowercase and split on whitespace
    """
    return text.lower().split()

def build_corpus(db: Session) -> tuple[BM25Okapi, list[dict]]:
     """
    Build an in-memory BM25 index from every chunk in Postgres.

    Returns:
        (
            bm25_index,
            chunks
        )

    where chunks[i] corresponds to bm25 score index i.
    """
     chunk_rows = (
          db.query(Chunk).order_by(Chunk.id).all()
     )

     chunks = [
          {
              "id": row.id,
              "document_id":row.document_id,
              "content":row.content,
              "chunk_index":row.chunk_index 
          }
          for row in chunk_rows
     ]

     tokenized_corpus = [
          tokenize(chunk["content"]) for chunk in chunks 
     ]

     bm25 = BM25Okapi(tokenized_corpus)
     # the return values are the BM@)OKapi object which gives us access to the get_score method that returns a numpy array of scores with index corresponding to the index chunk in the chunks list which is why we are also returning the chunks list: this enables me to map the chunk to the score by index 

     return bm25, chunks