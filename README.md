# AI Summarizer (Next.js + Prisma + OpenAI)

A small Next.js app to summarize long text, with optional OpenAI integration, local history, and a Postgres-backed save flow.

## Stack
- Next.js (App Router, API Routes)
- TypeScript, Tailwind
- Prisma ORM + PostgreSQL (Docker)
- Optional OpenAI Responses API (`gpt-4o-mini`)
- LocalStorage for recent attempts

## Quickstart
```bash
# 1) Install
pnpm i # or npm i

# 2) Start Postgres (Docker)
docker compose up -d

# 3) Configure env
cp .env.example .env
# edit DATABASE_URL and (optionally) OPENAI_API_KEY

# 4) Prisma
pnpm prisma:push

# 5) Run
pnpm dev
