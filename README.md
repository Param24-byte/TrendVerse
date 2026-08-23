# TrendVerse — Real-Time Trend Intelligence for Developers

TrendVerse is a full-stack dashboard that tracks and clusters emerging developer trends in real-time across multiple platforms (GitHub, Hacker News, Product Hunt, Hugging Face, Dev.to, Reddit, Stack Exchange). By scraping, vectorizing post content, and clustering topics using KMeans, TrendVerse dynamically extracts hot topics, scores their velocity, and generates AI Research Briefs.

---

## Architecture & Tech Stack

```text
                     ┌───────────────────────┐
                     │   Next.js App Router  │
                     │  (Orchestrator & UI)  │
                     └─┬─────────┬─────────┬─┘
           Ingest &    │         │         │ Research Brief
           DB Writes   ▼         │         ▼ Generation
  ┌─────────────────┐  │         │    ┌─────────────────┐
  │  Supabase DB    │◄─┘         │    │   Gemini API    │
  │  (PGVector RLS) │◄───────────┘    └─────────────────┘
  └─────────────────┘  Embed & Cluster
          ▲                  (FastAPI Python)
          │
  ┌───────┴────────────┐
  │  FastAPI Service   │
  │  (Python, Port 8000)│
  └────────────────────┘
```

1. **Frontend & Orchestration**: Next.js 16 (App Router) handles the UI, ingestion orchestration (`api/ingest`), and direct Gemini AI calls (`api/brief`).
2. **Backend**: Python FastAPI microservice dedicated purely to math: scikit-learn (KMeans clustering), SentenceTransformers (`all-MiniLM-L6-v2` for 384-dimensional vector embeddings).
3. **Database**: Supabase PostgreSQL with `pgvector` enabled for similarity search and Row Level Security (RLS).
4. **AI Generation**: Gemini 2.5 Flash for structured Markdown Research Brief synthesis, triggered securely via the Next.js API.

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

## 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Supabase Keys (from Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Gemini API (from Google AI Studio)
GEMINI_API_KEY=<your-gemini-api-key>

# Internal API Shared Secret (Auth-gates ingest/brief/ml endpoints)
INTERNAL_API_SECRET=<your-custom-shared-secret>

# Vercel Cron Secret (Required for automated scheduler authorization)
CRON_SECRET=<your-vercel-cron-secret>

# Bright Data Scrapers (Required for paid platform scrapers)
BRIGHTDATA_API_TOKEN=<your-brightdata-token>
BRIGHTDATA_GITHUB_SCRAPER_ID=<your-github-scraper-id>
BRIGHTDATA_HACKERNEWS_SCRAPER_ID=<your-hackernews-scraper-id>
BRIGHTDATA_PRODUCTHUNT_SCRAPER_ID=<your-producthunt-scraper-id>
BRIGHTDATA_HUGGINGFACE_SCRAPER_ID=<your-huggingface-scraper-id>

# Reddit API Configuration
REDDIT_USER_AGENT=TrendVerse/1.0 (by /u/yourusername)

# ML Python Service URL
ML_SERVICE_URL=http://localhost:8000
```

> [!NOTE]
> GitHub, Hacker News, Product Hunt, and Hugging Face scrapers utilize Bright Data Scraper Studio IDs. If these are not configured, they will fail gracefully and report detailed error messages, while native scrapers (Dev.to, Reddit, Stack Overflow) remain fully functional.

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

## Ingestion & Scrape Execution
Scraper execution is scheduled periodically every 30 minutes using Vercel Cron (`vercel.json`). You can also manually trigger ingestion and clustering:
1. Access the **Settings** page (requires logging in/registering).
2. Scroll to the **Data Ingestion Pipeline** panel.
3. Select a niche (e.g. `AI Tools`) and click **Execute Pipeline**. This will fetch raw posts, generate embeddings in batch, run KMeans clustering, and surface the latest trends dynamically (governed by a 15-minute execution cooldown).
