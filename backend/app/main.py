from config import settings
from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager
from models import create_all

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all()
    yield

app = FastAPI(
    lifespan=lifespan
)

@app.get("/health")
async def healthcheck():
    return {
        "status":200,
        "message": "I am healthy"
    }

