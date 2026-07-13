from config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from models import create_all
from database import engine
from sqlalchemy import text
import uvicorn
from routers import ingest, query, voice, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all()
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(result.scalar())
    yield

app = FastAPI(
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def healthcheck():
    return {
        "status":200,
        "message": "I am healthy"
    }

app.include_router(ingest.router, prefix="/api/v1")
app.include_router(query.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")

if __name__=="__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

