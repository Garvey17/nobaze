from openai import OpenAI
from config import settings
from chunker import Chunk
import logging

logging.basicConfig(
    level="INFO"
)
logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=settings.openai_api_key
)

def embed_chunks(chunks: list[Chunk]) -> list[dict]:
    chunks_with_embeddings = []
    content_list = [chunk.content for chunk in chunks if chunk.content]

    if not content_list:
         logger.info('no content to embed')
         return []

    try:
        embeddings = client.embeddings.create(
             input= content_list,
             model="text-embedding-3-small"
        )

        for i, embedding in enumerate(embeddings.data):
             updated_chunk = {
                  **chunks[i].model_dump(),
                  "embedding": embedding.embedding 
             }
             chunks_with_embeddings.append(updated_chunk)
            

    except Exception as e:
            logger.info(f'something went wrong while embedding chunks: {e}')
            raise

    return chunks_with_embeddings
    

