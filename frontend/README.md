# Nobaze — Frontend

A minimalist, high-contrast, production-grade frontend interface for the Nobaze RAG (Retrieval-Augmented Generation) Knowledge Base. 

This UI is designed with restraint and engineering utility in mind, conforming to a strict monochrome palette and typography settings to prioritize content and readability.

## Tech Stack

- **React + Vite** (JavaScript)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- Plain `fetch` for backend API interactions (no third-party HTTP wrappers)
- Standard React state hook primitives (no external global state managers)

## Key Features

1. **Monochrome Design**: High-contrast, sharp-cornered (max 4px border radius) aesthetics without color accents, shadows, or gradients.
2. **Tab-Based Navigation**: Instant switching between **Chat** and **Library** views without routers.
3. **Citations & Interactive Linkage**: Renders source citation numbers `[1]`, `[2]`, etc. inline. Clicking a citation expands the corresponding source card at the bottom of the assistant's response and scrolls/flashes it into focus.
4. **Streaming Animation**: A single blinking block cursor (`▋`) appended to the active streaming assistant response to denote that output is actively being generated.
5. **Ingest Drawer**: Collapsible panel to ingest plain text, website URLs, or server-side PDF paths. Refreshes the Library view state.
6. **Voice Querying**: Captures user voice inputs using the HTML5 `MediaRecorder` API (WebM) and retrieves + replays the backend's streaming MP3 audio answers.
7. **Library View**: Visual directory of all ingested sources with type badges, statuses, and deletion controls.

## Setup Instructions

### 1. Install Dependencies

Ensure you have Node.js installed, then execute the following inside the `frontend` directory:

```bash
npm install
```

*Note: If local compilation issues arise on Windows for Vite native dependencies, run `npm install @rolldown/binding-win32-x64-msvc`.*

### 2. Configure Environment Variables

Create a `.env` file at the root of the `frontend` directory:

```env
VITE_API_BASE_URL=http://54.235.26.154:8000
```

### 3. Run Development Server

Launch the Vite local dev server:

```bash
npm run dev
```

### 4. Build Production Bundle

To build the static application assets:

```bash
npm run build
```
