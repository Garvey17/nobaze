from pinecone import Pinecone
from config import settings
from openai import OpenAI
from rank_bm25 import BM25Okapi
from services.bm25_store import tokenize
from sqlalchemy.orm import Session
from services.bm25_store import build_corpus
from database import get_db


open_client = OpenAI(
    api_key=settings.openai_api_key
)

pc = Pinecone(api_key=settings.pinecone_api_key)

def semantic_search(query: str, top_k: int = 20) -> list[dict]:
    #embed the user query with the same settings that was user to embed the chunks
    embedded_query = open_client.embeddings.create(
        input=query,
        model="text-embedding-3-small",
        dimensions=512,
    )

    #pinecone index
    index = pc.Index(
        name=settings.pinecone_index_name
    )
    #search for the user query via its embeddings on the pinecone vector store based on similarity

    search_result = index.query(
        vector=embedded_query.data[0].embedding,
        top_k= top_k,
        include_metadata=True
    )

    chunks_from_result = [
        {
            "chunk_id":result.id,
            "score": result.score,
            "document_id": result.metadata["document_id"],
            "chunk_index": result.metadata["chunk_index"],
            "content": result.metadata["content"],
        }
        for result in search_result.matches
    ]

    return chunks_from_result

    
def bm25_search(query: str, bm25: BM25Okapi, corpus: list[dict], top_k: int = 20) -> list[dict]:
    """
    Function responsible for running keyword search from the chunks corpus that have been built and stored in memory. returns the list of chucks that score the highest from the keyword search 
    """

    #Tokenise the query in the same order that the chuks were tokenized before corpus was built
    tokenised_query = tokenize(query)

    #the get_scores method returns a numpy array of scores with index corresponding to the corpus item indices
    key_rank_scores = bm25.get_scores(tokenised_query)

    #returns the best 20 score index
    ranked_indices = sorted(
        range(len(key_rank_scores)),
        key=lambda i: key_rank_scores[i],
        reverse=True
    )[:top_k]

    results = []

    for i in ranked_indices:
        chunk = corpus[i]

        results.append(
            {
                "chunk_id": chunk["id"],
                "score": float(key_rank_scores[i]),
                "document_id": chunk["document_id"],
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"]
            }
        )
    
    return results

from collections import defaultdict
#Reciprocal rank fusion (RRF)
def reciprocal_rank_fusion(
        semantic_results: list[dict],
        bm25_Result: list[dict],
        top_k: int = 5,
        k: int = 60
) -> list[dict]:
    
    scores = defaultdict(float)
    chunk_lookup = {}

    for rank, chunk in enumerate(semantic_results, start=1):
        chunk_id = chunk["chunk_id"]

        scores[chunk_id] += 1/(k+rank)
        chunk_lookup[chunk_id] = chunk

    
    for rank, chunk in enumerate(bm25_Result, start=1):
        chunk_id  = chunk["chunk_id"]

        scores[chunk_id] += 1/(k + rank)

        if chunk_id not in chunk_lookup:
            chunk_lookup[chunk_id] = chunk
    
    ranked = sorted(
        scores.items(),
        key= lambda item: item[1], #returning the second element of each item as a key to be sorted, in this case the second element is the scores and the first element is the chunk_id
        reverse=True
    )

    results = []

    for chunk_id, rrf_score in ranked[:top_k]:
        chunk = chunk_lookup[chunk_id].copy()
        chunk["rrf_score"] = rrf_score
        results.append(chunk)
    
    return results

#orchestration function

def search(query: str, db: Session, top_k: int = 5) -> list[dict]:
    """
    Orchestration function responsible for wiring search operations together
    """

    #build corpus
    bm25, corpus = build_corpus(db)

    #semantic search operation
    semantic_results = semantic_search(query, top_k=20)

    #keyword search operation with bm25
    bm25_results = bm25_search(query, bm25, corpus, top_k=20)

    #reciprocal rank fusion
    rrf_results = reciprocal_rank_fusion(semantic_results, bm25_results, top_k=top_k)

    return rrf_results


if __name__ == "__main__":
    db = next(get_db())
    try:
        results = search("Test question", db)
        for  r in results:
            print(r["chunk_id"], r["rrf_score"], r["content"][:100])
    finally:
        db.close()