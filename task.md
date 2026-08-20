# TrendVerse Task List

## Phase 1: Bright Data Scraper Integration (Completed)
- `[x]` Install Bright Data CLI & Setup Authentication
- `[x]` Create Python script to trigger Bright Data scrapers (`run_scrapers.py`)
- `[x]` Create Python script to normalize and ingest data to Supabase (`normalize.py`)
- `[x]` Add a 6-hour interval scheduler for running the scrapers
- `[x]` Verify data ingestion into Supabase & Map external URLs to display in frontend

## Phase 2: User Interface, Auth & Pages (Upcoming)
- `[ ]` **Upgradation of UI**: Enhance the frontend design to be more modern and responsive.
- `[ ]` **Creation of Pages**: Build out additional views (e.g., individual trend detail pages, dashboard variations).
- `[ ]` **Authentication**: Implement Auth (e.g., via Supabase Auth) to allow users to sign up, log in, and save favorite trends.

## Phase 3: Data Segregation & Backend Architecture (Upcoming)
- `[ ]` **Supabas Data Arrangement**: Configure the database and frontend to seamlessly toggle between different niches (e.g., AI/ML vs. Web Dev).
- `[ ]` **Breakout in Backend**: Refactor the Python ML backend (FastAPI) and Next.js API routes into a more scalable, modular architecture (microservices or distinct modules).
- `[ ]` **Claude AI Integration**: Loop Claude into the backend/repo to perform automated checks, generate trend summaries, or provide code/data insights.

## Phase 4: Documentation (Ongoing)
- `[ ]` **Create Proper README**: Write a comprehensive `README.md` for developers setting up the repository.
- `[x]` **Project Crux Document**: Create an overarching markdown file detailing the "what, why, and how" of the project (`project_overview.md`).
- `[ ]` **Self-Healing Script**: Create Python script for scraper self-healing (`heal.py`).

## Phase 5: Production Readiness & DevOps (Upcoming)
- `[ ]` **Deployment (CI/CD)**: Set up Vercel for the Next.js frontend and a containerized cloud host (e.g. Render/Railway/AWS) for the FastAPI backend, along with GitHub Actions.
- `[ ]` **Monitoring & Logging**: Integrate tools like Sentry/Datadog to catch scraping failures and backend panics.
- `[ ]` **API Security**: Add API key authentication to FastAPI endpoints so they cannot be triggered publicly, and implement rate limiting.
- `[ ]` **Automated Testing**: Add `pytest` for the Python ML clustering logic and basic UI component tests for Next.js.
