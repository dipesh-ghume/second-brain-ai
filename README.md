# Second Brain AI — Personal Intelligence System

A full-stack AI-powered knowledge management system that captures, organizes, retrieves, and thinks with your data.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL 16 + pgvector (Docker)
- **ORM**: Prisma 7
- **AI**: Ollama (local, llama3) + OpenAI (optional, gpt-4o-mini)
- **Rich Editor**: Tiptap
- **Content Extraction**: @extractus/article-extractor

## Features

- **Smart Bookmark Manager** — Save URLs, auto-extract content, AI-generated summaries/tags/insights
- **Second Brain Notes** — Rich text notes with AI summarization, action item extraction, related notes
- **Semantic Search** — Natural language queries over your knowledge base using pgvector embeddings
- **AI Insights Dashboard** — Weekly brain reports, knowledge patterns, stats
- **YouTube Summarization** — Paste YouTube URLs to get AI analysis
- **Smart AI Routing** — Auto-switches between Ollama (simple tasks) and OpenAI (complex tasks)
- **Dark Mode** — Full dark theme with light mode toggle

## Prerequisites

- Node.js 20+
- Docker & docker-compose
- Ollama with `llama3` model (`ollama pull llama3`)

## Setup

```bash
# 1. Clone and install
npm install

# 2. Start PostgreSQL with pgvector
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run database migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://secondbrain:secondbrain@localhost:5432/second_brain` |
| `AI_PROVIDER` | AI provider: `ollama`, `openai`, or `smart` | `ollama` |
| `OLLAMA_BASE_URL` | Ollama API URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3` |
| `OPENAI_API_KEY` | OpenAI API key (required for `openai`/`smart` mode) | — |

## Architecture

```
app/                    # Next.js App Router pages & API routes
  api/bookmarks/        # Bookmark CRUD + AI processing
  api/notes/            # Note CRUD + AI processing
  api/search/           # Semantic vector search + AI answers
  api/embeddings/       # Batch embedding generation
  api/insights/         # AI insights + weekly reports
lib/
  ai/                   # AI service layer (ollama, openai, provider, embeddings)
  db/                   # Prisma client singleton
  utils/                # Content fetcher, YouTube, text utilities
components/             # React UI components
prisma/                 # Schema + migrations
```
