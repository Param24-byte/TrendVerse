# TrendVerse — Real-Time Trend Intelligence for Developers

TrendVerse is a full-stack dashboard that tracks and clusters emerging developer trends in real-time across multiple platforms (GitHub, Hacker News, Product Hunt, Hugging Face, Dev.to, Reddit, Stack Exchange). By scraping, vectorizing post content, and clustering topics using KMeans, TrendVerse dynamically extracts hot topics, scores their velocity, and generates AI Research Briefs.

---

## Architecture & Tech Stack

```
                     ┌───────────────────────┐
                     │   Next.js Frontend    │
                     │  (App Router, Port 3000)
                     └──────────┬────────────┘
                                │ Requests
                                ▼
  ┌─────────────────┐    ┌──────┴────────────┐    ┌─────────────────┐
  │  Supabase DB    │◄───┤  FastAPI Service   │───►│   Gemini API    │
  │  (PGVector RLS) │    │  (Python, Port 8000)│   │  (Brief Gen)    │
  └─────────────────┘    └───────────────────┘    └─────────────────┘
```

1. **Frontend**: Next.js 16 (App Router), Tailwind CSS, Framer Motion, Recharts, shadcn/ui.
2. **Backend**: Python FastAPI, scikit-learn (KMeans clustering), SentenceTransformers (`all-MiniLM-L6-v2` for 384-dimensional vector embeddings).
3. **Database**: Supabase PostgreSQL with `pgvector` enabled for similarity search and Row Level Security (RLS).
4. **AI Generation**: Gemini 2.5 Flash for structured Markdown Research Brief synthesis.

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- Python (v3.9+ recommended)
- A Supabase project (Free tier works perfectly)
- Gemini API Key

---

## 1. Database Setup (Supabase)

1. Open your Supabase Project dashboard.
2. Navigate to the **SQL Editor**.
3. Create a new query and paste the contents of [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql).
4. Run the script. This will:
   - Enable the `pgvector` extension.
   - Create tables: `sources`, `posts`, `trends`, `trend_posts`, and `research_reports`.
   - Setup Row Level Security (RLS) policies allowing read access to users and service role access for backend write operations.

---



---

## 3. Backend Setup (FastAPI)

1. Navigate to the `python-service` directory:
   ```bash
   cd python-service
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Uvicorn server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend health check will be available at [http://localhost:8000/health](http://localhost:8000/health).

---

## 4. Frontend Setup (Next.js)

1. Navigate to the root directory and install npm packages:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

---


