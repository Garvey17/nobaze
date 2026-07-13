# Nobaze — Frontend Coding Agent Prompt

## Project Overview

Build the frontend for **Nobaze**, a production-grade RAG (Retrieval-Augmented Generation) Knowledge Base. The backend is a deployed FastAPI application. This UI is a portfolio piece targeting AI engineering hiring managers and technical interviewers — it must communicate technical sophistication through restraint, not decoration.

---

## Visual Direction

**Aesthetic:** Minimalist. Black and white. High contrast. No color accents — monochrome only.

**Palette (strict):**
- `#000000` — primary background
- `#0A0A0A` — surface / card backgrounds
- `#111111` — elevated surfaces
- `#1A1A1A` — borders and dividers
- `#FFFFFF` — primary text
- `#A0A0A0` — secondary / muted text
- `#3A3A3A` — disabled / inactive states
- `#FFFFFF` with 5% opacity — subtle hover states

**Typography:**
- Display / headings: `JetBrains Mono` (signals technical identity — a coding font used for UI copy creates deliberate friction that reads as engineered, not designed)
- Body / chat text: `Inter` (legible at small sizes, neutral carrier for content)
- Load both from Google Fonts

**Signature element:** A single blinking cursor `▋` that appears at the end of streaming assistant responses — the only animated element on the page. Everything else is static. This earns its motion because it is semantically true: the model is still writing.

**Border radius:** `4px` maximum everywhere. Sharp corners read as engineered.

**No shadows.** Use borders (`1px solid #1A1A1A`) for depth instead.

---

## Tech Stack

- **React + Vite**
- **Tailwind CSS** (utility classes only, no custom components library)
- Plain `fetch` for API calls — no axios
- No Redux — React state only (`useState`, `useEffect`, `useRef`)

---

## Backend API

Base URL: configurable via `VITE_API_BASE_URL` environment variable (e.g. `http://<ec2-ip>:8000`)

### Endpoints

#### `POST /api/v1/ingest`
Ingest a document source.
```json
// Request
{ "source_type": "url" | "pdf" | "text", "source": "<url or text content>" }

// Response
{ "document_id": "uuid", "source_name": "string", "status": "complete" | "failed" }
```

#### `POST /api/v1/query`
Ask a question against the knowledge base.
```json
// Request
{ "query": "string", "top_k": 5 }

// Response
{
  "answer": "string with inline citations like [1][2]",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "chunk_index": 0,
      "content": "string",
      "rrf_score": 0.016
    }
  ]
}
```

#### `POST /api/v1/voice`
Upload audio file, receive streaming audio response (MP3).
```
// Request: multipart/form-data with field "audio" containing audio file
// Response: StreamingResponse, Content-Type: audio/mpeg
```

#### `GET /api/v1/documents`
List all ingested documents.
```json
[
  {
    "document_id": "uuid",
    "source_type": "url" | "pdf" | "text",
    "source_name": "string",
    "status": "complete" | "failed" | "processing" | "pending",
    "created_at": "ISO datetime"
  }
]
```

#### `DELETE /api/v1/documents`
Delete one or more documents.
```json
// Request
{ "document_ids": ["uuid1", "uuid2"] }
// Response: 204 No Content
```

---

## Application Structure

Single-page application. No routing library needed — use tab state to switch between views.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  NOBAZE                              [Chat] [Library] │  ← Header (fixed)
├─────────────────────────────────────────────────────┤
│                                                     │
│              [ Active View ]                        │  ← Main content area
│                                                     │
└─────────────────────────────────────────────────────┘
```

Header:
- Left: `NOBAZE` in JetBrains Mono, white, bold — wordmark only, no logo
- Right: two tab buttons `Chat` and `Library` — active tab has white text + bottom border `1px solid #FFFFFF`, inactive is `#A0A0A0`

---

## View 1: Chat (default view)

This is the primary interface. It has three zones:

```
┌─────────────────────────────────────────────────────┐
│  NOBAZE                              [Chat] [Library] │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │          Chat message history               │   │  ← Scrollable
│   │                                             │   │
│   │  [user message]                             │   │
│   │                   [assistant message + sources] │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  [🎤] [text input                    ] [→]  │   │  ← Input bar (fixed bottom)
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  [+ Add Source]                             │   │  ← Ingest panel (collapsible)
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Chat Messages

**User message:**
- Right-aligned
- Background: `#1A1A1A`
- Border: `1px solid #3A3A3A`
- Font: Inter 14px
- Padding: `12px 16px`
- Border radius: `4px`
- No avatar or label

**Assistant message:**
- Left-aligned, full width
- No background — sits directly on page background
- Answer text in white, Inter 14px, line-height 1.7
- Inline citation numbers `[1]` `[2]` rendered as: white text, `1px solid #3A3A3A` border, `2px 6px` padding, `2px` border-radius, JetBrains Mono font, 11px — clicking a citation number scrolls to or highlights the corresponding source card
- After the answer text: a `Sources` section with expandable source cards

**Source cards** (collapsed by default, expand on click):
```
┌──────────────────────────────────────────────────┐
│  [1]  chunk_index · document_id (truncated)  [↓] │  ← collapsed
├──────────────────────────────────────────────────┤
│  Full chunk content text...                      │  ← expanded
│  RRF score: 0.0164                               │
└──────────────────────────────────────────────────┘
```
Border: `1px solid #1A1A1A`. No background. Expand/collapse with a chevron.

**Streaming cursor:** While the assistant is responding, append `▋` after the last character. Remove it when the response is complete. This is the only animation — a simple CSS blink keyframe at 1s interval.

**Empty state** (no messages yet):
Center the page with:
```
NOBAZE
Ask anything about your knowledge base.
```
In JetBrains Mono. Underneath, two example prompt chips in `#1A1A1A` bordered boxes that pre-fill the input on click.

### Input Bar

- Fixed to bottom of chat area
- Full width text input, dark background `#0A0A0A`, white text, `1px solid #1A1A1A` border
- Placeholder: `Ask a question...`
- Submit on Enter or click the `→` button
- Loading state: input disabled, submit button replaced with a static `···` text (no spinner — keep it minimal)
- `🎤` microphone button on the left — triggers voice query flow

### Voice Query Flow

When the microphone button is clicked:
1. Button turns white (active state)
2. Show label below input: `Recording... click to stop`
3. Use browser `MediaRecorder` API to capture audio (webm format)
4. On stop: show `Processing...` label
5. Send audio blob to `POST /api/v1/voice` as `multipart/form-data` with field name `audio`
6. Receive streaming audio response — collect full audio bytes, create a `Blob` with `audio/mpeg`, create an object URL, play via `new Audio(url).play()`
7. Add the transcribed question as a user message (note: the backend doesn't return the transcription — display a placeholder `[Voice query]` as the user message)
8. Add the audio response as an assistant message with a `🔊 Voice response` label and a play button to replay

### Ingest Panel

A collapsible panel at the bottom, toggled by `+ Add Source` / `− Add Source`.

When expanded:
```
┌────────────────────────────────────────────────┐
│  Source type: [URL] [Text]                     │
│                                                │
│  [URL input or text area              ]        │
│                                                │
│                              [Ingest →]        │
└────────────────────────────────────────────────┘
```

- `URL` tab: single text input, placeholder `https://...`
- `Text` tab: textarea, placeholder `Paste plain text...`
- PDF upload is not included (backend accepts a file path, not an upload — omit from UI)
- On submit: show inline status `Ingesting...` → `✓ Ingested` or `✗ Failed`
- On success: refresh the document list in the Library view

---

## View 2: Library

Shows all ingested documents. This view communicates the breadth of the knowledge base.

```
┌─────────────────────────────────────────────────────┐
│  NOBAZE                              [Chat] [Library] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base  ·  {n} sources                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  URL  python-docx.readthedocs.io   complete  [×]│ │
│  ├───────────────────────────────────────────────┤  │
│  │  TEXT  Pasted content              complete  [×]│ │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each row:
- Left: source type badge (`URL` / `TEXT` / `PDF`) in JetBrains Mono, 10px, uppercase, `1px solid #3A3A3A` border, `2px 6px` padding
- Middle: source name (truncated with ellipsis if long)
- Right: status chip + delete button `×`
- Status chips: `complete` (white text), `processing` (muted text), `failed` (white text, `1px solid #3A3A3A`)
- Delete button `×`: muted color, turns white on hover — clicking sends `DELETE /api/v1/documents` with that document's id, then refreshes the list
- On load and after any ingest/delete: fetch `GET /api/v1/documents` to refresh

Empty state: `No sources yet. Add one from the Chat view.` centered, muted text.

---

## Component Structure

```
src/
├── App.jsx                  ← tab state, layout shell
├── components/
│   ├── Header.jsx           ← wordmark + tab nav
│   ├── ChatView.jsx         ← chat orchestration
│   ├── MessageList.jsx      ← scrollable message history
│   ├── Message.jsx          ← single message (user or assistant)
│   ├── SourceCard.jsx       ← expandable source chunk card
│   ├── InputBar.jsx         ← text input + mic + submit
│   ├── IngestPanel.jsx      ← collapsible ingest form
│   └── LibraryView.jsx      ← document list
├── api/
│   └── client.js            ← all fetch calls, base URL from env
└── hooks/
    └── useChat.js           ← message state, query/voice handlers
```

---

## Key Implementation Notes

1. **Citation linking:** Parse `[1]`, `[2]` etc. in the answer string using a regex. Render each as a clickable span. On click, expand the corresponding source card and scroll it into view.

2. **Voice recording:** Use `navigator.mediaDevices.getUserMedia({ audio: true })` then `MediaRecorder`. Store chunks in an array, assemble into a `Blob` on stop, send to the API.

3. **Message state shape:**
```js
{
  id: crypto.randomUUID(),
  role: 'user' | 'assistant',
  content: 'string',
  sources: [] | null,    // only on assistant messages
  isVoice: false,        // true for voice responses
}
```

4. **API base URL:** Read from `import.meta.env.VITE_API_BASE_URL`. Create a `.env` file at the frontend root:
```
VITE_API_BASE_URL=http://<ec2-ip>:8000
```

5. **Scroll behavior:** After each new message, scroll `MessageList` to bottom using a `useEffect` with a ref on the last message.

6. **Error handling:** All API errors should render as assistant messages with content: `Something went wrong. Please try again.` — no modal, no toast, no separate error UI.

7. **Responsive:** Works at 768px minimum width. No mobile-specific layout needed — this is a desktop tool.

---

## What NOT to include

- No color accents of any kind
- No gradients
- No shadows or glows
- No loading spinners — use text states only (`···`, `Processing...`, `Ingesting...`)
- No icons library — use Unicode characters only (`→`, `×`, `↓`, `↑`, `🎤`, `🔊`, `▋`)
- No toast notifications
- No modals
- No authentication UI
- No sidebar navigation
- No dark/light mode toggle — always dark

---

## Deliverable

A single Vite + React project, fully functional against the backend API described above. All components in one codebase. Include a `README.md` with:
- Setup instructions (`npm install`, `npm run dev`)
- How to set `VITE_API_BASE_URL`
- Brief description of each feature

The UI should feel like a tool built by an engineer who takes design seriously — not a design portfolio piece built by someone who learned to code.
