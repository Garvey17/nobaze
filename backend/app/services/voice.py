import io
from openai import OpenAI
from config import settings
from collections.abc import Generator
from sqlalchemy.orm import Session
from services.searcher import search
from services.generator import generate_streaming

client = OpenAI(
    api_key=settings.openai_api_key
)

def transcribe(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """
    Transcribe audio to text using openAI Whisper
    """

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.webm"

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )

    return transcript.text

import re

SENTENCE_REGEX = re.compile(r"([.!?])(\s|$)")

def stream_tts(text_stream, voice: str = "alloy") -> Generator[bytes, None, None]:
    """
    accumulates streamed tokens into a buffer and converts to voice on sentence boundry
    """

    buffer = ""

    for token in text_stream:
        buffer += token

        while True:
            match = SENTENCE_REGEX.search(buffer)

            if not match:
                break

            end = match.end(1)

            sentence = buffer[:end].strip()

            buffer = buffer[match.end():]

            if sentence:
                response = client.audio.speech.create(
                    model="tts-1",
                    voice=voice,
                    input=sentence,
                )

                yield response.read()

    if buffer.strip():
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input = buffer.strip()
        )

        yield response.read()


def voice_answer(audio_bytes: bytes, db: Session) -> Generator[bytes, None, None]:
    """
    Wires the voice orchesratation together from stt to tts llm call in between
    """

    query = transcribe(audio_bytes)
    chunks = search(query, db)
    text_stream = generate_streaming(query, chunks)

    yield from stream_tts(text_stream)


if __name__ == "__main__":
    from database import get_db
    
    db = next(get_db())
    
    with open("test_question.m4a", "rb") as f:
        audio_bytes = f.read()
    
    output = b""
    for audio_chunk in voice_answer(audio_bytes, db):
        output += audio_chunk
    
    with open("answer.mp3", "wb") as f:
        f.write(output)
    
    print("Done — play answer.mp3")