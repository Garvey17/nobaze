# Nobaze — RAG Knowledge Base

A production-grade Retrieval-Augmented Generation (RAG) system that lets you ingest documents from multiple sources, query them with natural language, and receive grounded answers with source citations. Built as a portfolio project to demonstrate full-stack AI engineering competency.

**Live API:** `http://54.235.26.154:8000/docs`

---

## What It Does

You feed Nobaze documents — web pages, PDFs, or plain text. It chunks them, embeds them, and indexes them in a vector store. When you ask a question, it retrieves the most relevant chunks using hybrid search, feeds them to an LLM with a strict citation prompt, and returns an answer grounded in your knowledge base — not in the model's training data.

The system also supports voice: speak a question, receive a spoken answer.

---

## Architecture

### Ingestion Pipeline

```mermaid
flowchart LR
    A([PDF / URL / Text]) --> B[Parser\nper source type]
    B --> C[Chunker\n512 chars · 64 overlap]
    C --> D[Embedder\ntext-embedding-3-small\n512 dimensions]
    D --> E1[(Pinecone\nVector Store)]
    D --> E2[(PostgreSQL\nMetadata Store)]

    style A fill:#000,color:#fff,stroke:#444
    style B fill:#111,color:#fff,stroke:#333
    style C fill:#111,color:#fff,stroke:#333
    style D fill:#111,color:#fff,stroke:#333
    style E1 fill:#111,color:#fff,stroke:#333
    style E2 fill:#111,color:#fff,stroke:#333
```

### Query Pipeline

```mermaid
flowchart LR
    Q([User Query]) --> EMB[Embed Query\ntext-embedding-3-small]
    Q --> TOK[Tokenize Query\nlowercase · split]

    EMB --> SEM[Semantic Search\nPinecone · top-20\ncosine similarity]
    TOK --> BM25[BM25 Search\nin-memory corpus · top-20\nterm frequency]

    SEM --> RRF[Reciprocal Rank Fusion\nscore = Σ 1 ÷ 60 + rank\ntop-5 chunks]
    BM25 --> RRF

    RRF --> GEN[Generator\ngpt-4o-mini\ngrounded prompt]
    GEN --> ANS([Answer + Citations])

    style Q fill:#000,color:#fff,stroke:#444
    style ANS fill:#000,color:#fff,stroke:#444
    style EMB fill:#111,color:#fff,stroke:#333
    style TOK fill:#111,color:#fff,stroke:#333
    style SEM fill:#111,color:#fff,stroke:#333
    style BM25 fill:#111,color:#fff,stroke:#333
    style RRF fill:#111,color:#fff,stroke:#333
    style GEN fill:#111,color:#fff,stroke:#333
```

### Voice Pipeline

```mermaid
flowchart LR
    A([Audio Input]) --> STT[Whisper STT\naudio → transcript]
    STT --> RAG[RAG Query Pipeline\nsearch + generate]
    RAG --> BUF[Sentence Buffer\ndetect . ? ! boundaries]
    BUF -->|complete sentence| TTS[TTS-1\nsentence → audio bytes]
    TTS -->|stream| OUT([Audio Response])
    BUF -->|remaining tokens| BUF

    style A fill:#000,color:#fff,stroke:#444
    style OUT fill:#000,color:#fff,stroke:#444
    style STT fill:#111,color:#fff,stroke:#333
    style RAG fill:#111,color:#fff,stroke:#333
    style BUF fill:#111,color:#fff,stroke:#333
    style TTS fill:#111,color:#fff,stroke:#333
```

### Deployment

```mermaid
flowchart TB
    CLIENT([Client / Browser]) -->|HTTP :8000| ALB

    subgraph EC2 ["AWS EC2 · t3.small · Ubuntu 24.04"]
        ALB[Public IP :8000]
        ALB --> BACK[Backend Container\nFastAPI · Uvicorn]
        BACK <-->|rag-network| PG[(PostgreSQL Container\nport 5432 internal only)]
    end

    BACK <-->|HTTPS| PIN[(Pinecone\nCloud Vector Store)]
    BACK <-->|HTTPS| OAI[OpenAI API\nEmbeddings · GPT · Whisper · TTS]

    style CLIENT fill:#000,color:#fff,stroke:#444
    style EC2 fill:#0a0a0a,color:#fff,stroke:#333
    style ALB fill:#111,color:#fff,stroke:#333
    style BACK fill:#111,color:#fff,stroke:#333
    style PG fill:#111,color:#fff,stroke:#333
    style PIN fill:#111,color:#fff,stroke:#333
    style OAI fill:#111,color:#fff,stroke:#333
```

---

## Technical Decisions

### Why Hybrid Search?

Semantic search excels at intent matching but struggles with exact terms — product codes, proper nouns, acronyms. BM25 handles exact keyword matching but has no understanding of meaning. Running both and fusing the results with Reciprocal Rank Fusion (RRF) consistently outperforms either approach alone. This is the standard approach in production RAG systems at scale.

### Why RRF Over Score Normalization?

Pinecone returns cosine similarity scores and BM25 returns term frequency scores — these live in completely different numerical ranges and cannot be meaningfully compared or averaged. RRF bypasses this by only caring about rank position, not raw score. A chunk ranked 1st in both lists scores higher than one ranked 1st in only one list — simple, effective, and requires no calibration.

### Why In-Memory BM25?

For portfolio scale, loading all chunk text from Postgres into a `BM25Okapi` index on startup and refreshing it after each ingestion avoids the operational complexity of running Elasticsearch or OpenSearch. The tradeoff is that BM25 must be rebuilt on restart, but for a knowledge base of this scope that takes milliseconds.

### Why Sentence-Buffered TTS Streaming?

Waiting for the full LLM response before calling TTS would mean 3-4 seconds of silence before the user hears anything. By accumulating streaming tokens into a buffer, detecting sentence boundaries, and firing TTS on each complete sentence, the user hears the first sentence while the model is still generating the rest — perceived latency drops from ~4s to ~1s.

---

## Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | FastAPI | Async, production-grade, automatic OpenAPI docs |
| Vector Store | Pinecone | Managed, scalable, fast approximate nearest-neighbour |
| Embeddings | `text-embedding-3-small` (512-dim) | Strong quality/cost ratio |
| LLM | `gpt-4o-mini` | Sufficient quality for RAG generation at low cost |
| Keyword Search | `rank-bm25` (BM25Okapi) | Pure Python, no infrastructure required |
| Fusion | Reciprocal Rank Fusion | Score-agnostic, no calibration needed |
| PDF Parsing | PyMuPDF (`fitz`) | Fast, accurate, preserves structure better than pypdf |
| Web Scraping | `httpx` + BeautifulSoup4 | Lightweight, handles redirects and encoding |
| Chunking | `langchain-text-splitters` (RecursiveCharacterTextSplitter) | Semantic chunking with configurable overlap |
| STT | OpenAI Whisper API | Accurate, handles multiple audio formats |
| TTS | OpenAI TTS-1 | Low-latency, sentence-level streaming |
| Database | PostgreSQL | Document and chunk metadata, chat persistence |
| ORM | SQLAlchemy 2.0 | Type-safe, modern mapped column syntax |
| Deployment | EC2 + Docker Compose | Single-host, reproducible, zero cold-start |
| Frontend | React + Vite | Fast, component-based, familiar ecosystem |

---

## Project Structure

```
nobaze/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, lifespan, router registration
│   │   ├── config.py                # pydantic-settings, env var validation
│   │   ├── database.py              # SQLAlchemy engine, session, get_db()
│   │   ├── models.py                # Document, Chunk ORM models + create_all()
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── ingest.py            # POST /api/v1/ingest
│   │   │   ├── query.py             # POST /api/v1/query
│   │   │   ├── voice.py             # POST /api/v1/voice
│   │   │   └── documents.py         # GET/DELETE /api/v1/documents
│   │   └── services/
│   │       ├── ingestion.py         # Source parsers + ingest() orchestrator
│   │       ├── chunker.py           # RecursiveCharacterTextSplitter wrapper
│   │       ├── embedder.py          # OpenAI embeddings batch call
│   │       ├── indexer.py           # Pinecone upsert + Postgres bulk insert
│   │       ├── bm25_store.py        # Corpus builder + tokenizer
│   │       ├── searcher.py          # Semantic + BM25 + RRF fusion + search()
│   │       ├── generator.py         # Prompt builder + GPT call + answer()
│   │       └── voice.py             # Whisper STT + sentence-buffered TTS
│   ├── Dockerfile
│   ├── requirements.txt
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js            # All fetch calls, base URL from env
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── ChatView.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── Message.jsx          # Citation parsing + source cards
│   │   │   ├── SourceCard.jsx
│   │   │   ├── InputBar.jsx         # Text input + mic button
│   │   │   ├── IngestPanel.jsx      # URL + text ingestion form
│   │   │   └── LibraryView.jsx      # Document list + delete
│   │   └── hooks/useChat.js         # Message state, query/voice handlers
│   └── vite.config.js
└── infra/
    └── deploy.sh                    # One-command deploy via SSH + git pull
```

---

## Features

### Multi-Source Ingestion

- **URL** — fetches a webpage, extracts paragraph text, discards nav/scripts/headers
- **PDF** — page-by-page text extraction via PyMuPDF
- **Plain text** — direct ingestion of raw text content

All sources flow through the same chunking → embedding → indexing pipeline after extraction. Each document is tracked in Postgres with a status (`pending` → `processing` → `complete` / `failed`).

### Hybrid Search with RRF

Every query runs two searches in parallel:

1. **Semantic search** — embeds the query with the same model used at ingestion time, queries Pinecone for top-20 nearest vectors by cosine similarity
2. **BM25 keyword search** — tokenizes the query, scores all chunks in the in-memory corpus, returns top-20 by term frequency

Reciprocal Rank Fusion merges both ranked lists into a single top-5 result set. Each result carries its `rrf_score` alongside the source chunk content and metadata.

### Grounded Generation with Citations

The LLM is given only the retrieved chunks as context — no access to its training knowledge for answering. Each chunk is numbered `[1]`, `[2]` etc. in the prompt. The model is instructed to cite chunk numbers inline and to explicitly state when the answer cannot be found in the provided context. The response carries both the answer text and the full source chunks so the client can render citations linked to actual content.

### Voice Support

- **Speech-to-Text** — audio bytes sent to Whisper API, returns transcript string
- **Streaming TTS with sentence buffering** — GPT streams tokens into a buffer; when a sentence boundary is detected (`.`, `?`, `!`), the complete sentence is sent to TTS-1 immediately while generation continues. Audio chunks are yielded back to the client sentence by sentence via `StreamingResponse`.
- **Local STT** — `speech_recognition` + microphone capture for local testing

### REST API

All endpoints under `/api/v1/`. Interactive docs at `/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingest` | Ingest a URL, PDF path, or text |
| `POST` | `/api/v1/query` | Query the knowledge base, returns answer + sources |
| `POST` | `/api/v1/voice` | Upload audio, returns streaming MP3 response |
| `GET` | `/api/v1/documents` | List all ingested documents |
| `DELETE` | `/api/v1/documents` | Bulk delete documents by ID |
| `GET` | `/health` | Health check |

---

## Running Locally

### Prerequisites

- Python 3.12+
- Docker Desktop
- Node.js 18+
- OpenAI API key
- Pinecone account + index (dimension: 512, metric: cosine)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in: DATABASE_URL, OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME

# Start Postgres
docker-compose up postgres -d

# Run the API
cd app
uvicorn main:app --reload
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

npm run dev
```

Frontend available at `http://localhost:5173`.

### Running with Docker Compose (full stack)

```bash
cd backend
docker-compose up --build -d
```

Both backend and Postgres start on a shared bridge network. Backend available at `http://localhost:8000`.

---

## Deployment

Deployed on AWS EC2 (`t3.small`, Ubuntu 24.04) using Docker Compose. Backend and Postgres run as separate containers on a shared internal network — Postgres is not exposed to the internet.

### Deploy a Code Change

```bash
git add .
git commit -m "your change"
git push
bash infra/deploy.sh
```

The deploy script SSHes into EC2, pulls the latest commit, rebuilds the backend image, and restarts the containers.

### Environment Variables (Production)

Create `/backend/.env` on the EC2 instance:

```env
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name
DATABASE_URL=postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=your_index_name
```

---

## API Usage Examples

### Ingest a URL

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"source_type": "url", "source": "https://docs.python.org/3/library/asyncio.html"}'
```

### Query the Knowledge Base

```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How does asyncio handle concurrency?", "top_k": 5}'
```

### Voice Query

```bash
curl -X POST http://localhost:8000/api/v1/voice \
  -F "audio=@question.webm" \
  --output answer.mp3
```

### List Documents

```bash
curl http://localhost:8000/api/v1/documents
```

---

## Design Decisions and Tradeoffs

**Chunking parameters (512 chars, 64 overlap):** The overlap ensures that context spanning a chunk boundary isn't lost. 512 characters fits comfortably within the embedding model's context window while keeping chunks semantically focused enough to be meaningful retrieval units.

**BM25 in-memory vs Elasticsearch:** Adding Elasticsearch would require another container, a separate deployment concern, and significant configuration overhead. For the document volumes this system targets, rebuilding a `BM25Okapi` index from Postgres on startup takes under a second. The tradeoff is startup time and memory — neither is a concern at this scale.

**`gpt-4o-mini` over `gpt-4o`:** The retrieval quality is the bottleneck in a RAG system, not the generation model. Upgrading the LLM without improving retrieval yields marginal improvement. `gpt-4o-mini` at a fraction of the cost produces equivalent generation quality given well-retrieved context.

**EC2 + Docker Compose over ECS Fargate:** For a single-service deployment, ECS Fargate adds task definition management, IAM role configuration, and ALB setup with no operational benefit. Docker Compose on EC2 achieves the same containerization guarantee with one command to deploy and one file to understand. A previous project in this portfolio (`docs-to-docs`) already demonstrates ECS/Fargate/ALB proficiency.

**`tts-1` over `tts-1-hd`:** Latency is the primary constraint in a voice pipeline. `tts-1-hd` produces noticeably better audio but adds ~300ms per sentence. In a sentence-buffered streaming pipeline where the user is already hearing audio while generation continues, that extra latency is more harmful to UX than the quality difference is beneficial.

---

## What's Next

- **WebSocket voice** — replace the HTTP upload/download voice flow with a persistent WebSocket connection using the OpenAI Realtime API for sub-500ms end-to-end voice latency
- **Chat history** — persist conversation sessions in Postgres, feed recent turns as context to the LLM for follow-up question handling
- **Namespace isolation** — Pinecone namespaces to support multiple independent knowledge bases per user
- **PDF upload** — replace file-path ingestion with multipart file upload stored to S3 before processing
- **Reranker** — add a cross-encoder reranking step after RRF fusion using `cross-encoder/ms-marco-MiniLM-L-6-v2` for higher precision

---

## Author

**Garvey** — Full-stack developer transitioning into AI engineering.
Building production-grade AI systems: RAG pipelines, agentic workflows, LLM integration, and cloud deployment.

[GitHub](https://github.com/Garvey17) · [LinkedIn](#)
