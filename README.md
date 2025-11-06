# 🧠 AI Summarizer App

A lightweight, full-stack text summarization app built with **Next.js**, **TypeScript**, and **Prisma**.  
Users can enter long text, generate AI-based summaries via OpenAI, store them in a database, and manage their local history — all from a clean, responsive UI.

---

## 🚀 Features

### 🔹 Core
- ✍️ **Summarize Text:** Enter text, hit “Summarize,” and get a concise summary generated via OpenAI (or a mock fallback).
- 💾 **Save Summaries:** Store summaries to the PostgreSQL database using Prisma ORM.
- 🕓 **History View:** Browse, search, and paginate through saved summaries.
- 💬 **Local History:** Recent summaries are cached in `localStorage` for quick access.
- 📋 **Copy to Clipboard:** One-click copy for each generated summary.

### 🔹 Quality of Life
- 🚫 Duplicate-save protection (Save button locks after successful save)
- ⏳ Async loading & friendly toast notifications
- 🔒 Rate-limit handling and input length checks
- 🧱 Fully type-safe (no lingering `any`s)
- 🧭 Responsive layout with autosizing textarea and sticky sidebar

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (via Docker) |
| Styling | TailwindCSS + custom theme variables |
| AI Service | OpenAI API (`gpt-4o-mini` via `/v1/responses`) |
| State Management | React Hooks (no external store) |

---

## ⚙️ Setup

### 1. Clone and install
```bash
git clone https://github.com/<your-username>/ai-summarizer.git
cd ai-summarizer
npm install
```

### 2. Set up the database (Docker)
```bash
docker-compose up -d
```

### 3. Configure environment
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://dev:dev@localhost:5432/summarizer?schema=public"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Initialize Prisma
```bash
npx prisma db push
```

### 5. Run the app
```bash
npm run dev
```
App will be available at: **http://localhost:3000**

---

## 🗄️ Database Schema

```prisma
model Summary {
  id           String   @id @default(cuid())
  originalText String
  summary      String
  createdAt    DateTime @default(now())

  // Index for faster sorting and pagination
  @@index([createdAt], map: "idx_summary_createdAt")
}
```

---

## 🧩 Architecture Overview

```
/src
 ├── app/
 │   ├── summarize/      → Main UI for text input and summarization
 │   ├── history/        → History list, search, pagination
 │   └── api/
 │       ├── summarize/  → Calls OpenAI API or mock fallback
 │       └── save-summary/ → Persists summaries via Prisma
 ├── components/
 │   ├── Button.tsx      → Shared button component (variants + loading)
 │   ├── CopyButton.tsx  → Reusable clipboard component
 │   └── Toast.tsx       → Notification system
 ├── lib/
 │   ├── ai.ts           → OpenAI + mock summarizer
 │   ├── localHistory.ts → Local storage helpers
 │   └── useAutosize.ts  → Auto-resizing textarea hook
 └── server/
     └── prisma.ts       → Prisma singleton client (globalThis pattern)
```

---

## ⚡ Technical Highlights
- **Type-safe AI integration:** all API responses validated without `any`.  
- **Global Prisma client:** prevents multiple connections during hot reload.  
- **`createdAt` index:** speeds up time-sorted queries for history pagination.  
- **SSR-safe utilities:** localStorage and textarea hooks guarded for server safety.  
- **Clean error handling:** user-friendly toast messages for network, rate-limit, or API issues.

---

## 🧱 Limits & Mock Mode
- Max input length: ~4000 characters (limited by OpenAI endpoint)
- Fallback mock summary if no API key provided
- Basic rate-limit and duplicate-save protection included

---

## 💡 Future Improvements
- 🔍 Advanced search filters (by date or text length)
- 🗂️ Export summaries as CSV or JSON
- 👥 User authentication (multi-user persistence)

---

## 🧭 How to Demo (2-Minute Walkthrough)

1. **Start the app**
   ```bash
   npm run dev
   ```
   Visit **http://localhost:3000/summarize**

2. **Generate a summary**
   - Paste or type at least 20 characters.
   - Click **Summarize**.
   - Watch loading → AI summary appears → click **Save** to store it.

3. **Test duplicate protection**
   - After saving, notice the button says **Saved** and is disabled until new text is summarized.

4. **Check local history**
   - Scroll down — the most recent summaries are saved locally and can be cleared via **Clear Recent**.

5. **View saved summaries**
   - Navigate to **/history** or use your browser manually.
   - See saved summaries listed by date (newest first).
   - Try **Search** for text in either original or summary.
   - If >10 results exist, a **Next →** button appears for pagination.

6. **Error behavior (optional)**
   - Temporarily remove your `OPENAI_API_KEY` → summaries use mock fallback.
   - Stop Docker DB → attempt to save → “Failed to save summary” toast.
   - Paste a huge text → “Your input is too long.” toast appears.

7. **Copy functionality**
   - Click **Copy** next to any summary to verify clipboard functionality.

✅ That’s it — full AI + DB + local UX flow demonstrated in under 2 minutes.

---
