from openai  import OpenAI
from config import settings
import logging
from services.searcher import search
from sqlalchemy.orm import Session

logging.basicConfig(
    level="INFO"
)

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=settings.openai_api_key,
)
def build_prompt(
    query: str,
    chunks: list[dict],
) -> list[dict]:
    """
    Build a prompt for the OpenAI Chat Completions API.

    Args:
        query: User's question.
        chunks: Retrieved chunks from hybrid search.

    Returns:
        List of chat messages.
    """

    context = "\n\n".join(
        f"[{i}] {chunk['content']}"
        for i, chunk in enumerate(chunks, start=1)
    )

    system_message = (
        "You are a knowledgeable assistant. "
        "Answer the user's question using ONLY the context chunks provided. "
        "Each chunk is labeled [1], [2], etc. "
        "Cite the chunk numbers inline in your answer, e.g. [1] or [2][3]. "
        "If the answer cannot be found in the provided context, say so explicitly. "
        "Do not use any knowledge outside the provided context."
    )

    user_message = (
        f"Context:\n"
        f"{context}\n\n"
        f"Question: {query}"
    )

    return [
        {
            "role": "system",
            "content": system_message,
        },
        {
            "role": "user",
            "content": user_message,
        },
    ]


def generate(query: str, chunks: list[dict]) -> dict:
    """
    Main function that calls llm and generate response based on the structured prompt built
    """

    #build prompt
    messages = build_prompt(query, chunks)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer,
            "sources": chunks
        }
    except Exception as e:
        logger.error(f'Could not complete API call: {e}')
        raise

#Orchestrator fucntion that wires search and generate together

def answer(query: str, db: Session) -> dict:
    """
    Joins search and generate operations
    """

    #call the search function which returns the chunk results of reciprocal rank fusion

    search_results = search(query, db)

    #call generator function 
    result = generate(query, search_results)

    return result

if __name__ == "__main__":
    from database import get_db

    db = next(get_db())
    try:
        llm_result = answer("what are the contributions made to the advancement brain tumor treatment by technology", db)
        print('Answer:', llm_result["answer"])
        print("\nSources:")
        for i, source in enumerate(llm_result["sources"], start=1):
            print(f"[{i}] {source['content'][:120]}")
    finally:
        db.close() 