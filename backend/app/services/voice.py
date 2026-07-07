import io
from openai import OpenAI
from openai import AsyncOpenAI
from config import settings
from collections.abc import Generator
from sqlalchemy.orm import Session
from services.searcher import search
from services.generator import generate_streaming
import speech_recognition as sr
from openai.helpers import LocalAudioPlayer

client = OpenAI(
    api_key=settings.openai_api_key
)

async_client = AsyncOpenAI(
    api_key=settings.openai_api_key
)

def local_stt() -> bytes:
    """
    initiates google speech to text worker that takes input audio from local microphone and returns text
    """

    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source)
        r.pause_threshold = 2

        print("Ask a question 🎤 ...")
        audio =  r.listen(source)

    audio_bytes = audio.get_wav_data()

    return audio_bytes

        #Recognise speech and return text

        # text = r.recognize_tensorflow(audio)

        # return text

    


def transcribe(audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
    """
    Transcribe audio to text using openAI Whisper
    """

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.wav"

    print(*"Processing Audio....")
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )

    print(transcript.text)
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
    import pygame
    from database import get_db

    db = next(get_db())

    try:
        audio_bytes = local_stt()

        audio_buffer = b""

        for audio_chunk in voice_answer(audio_bytes, db):
            print(".", end="", flush=True)
            audio_buffer += audio_chunk

        with open("answer.mp3", "wb") as f:
            f.write(audio_buffer)

        print("\nPlaying response...")

        pygame.mixer.init()
        pygame.mixer.music.load("answer.mp3")
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        
    finally:
        db.close()