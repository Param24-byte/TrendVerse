-- ============================================================
-- TrendVerse — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Table: sources ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform         TEXT NOT NULL CHECK (platform IN ('github', 'hackernews', 'producthunt', 'huggingface', 'devto', 'reddit', 'stackexchange')),
  niche            TEXT NOT NULL,
  config           JSONB,
  last_scraped_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Table: posts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id             UUID REFERENCES sources(id) ON DELETE SET NULL,
  platform              TEXT NOT NULL,
  niche                 TEXT NOT NULL,
  title                 TEXT,
  caption               TEXT,
  url                   TEXT,
  creator               TEXT,
  hashtags              TEXT[],
  engagement_count      INTEGER,
  engagement_breakdown  JSONB,
  rank_position         INTEGER,
  velocity_score        FLOAT,
  posted_at             TIMESTAMPTZ,
  scraped_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding             vector(384)
);

-- ── Table: trends ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trends (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche                 TEXT NOT NULL,
  cluster_label         TEXT,
  representative_title  TEXT,
  trend_score           FLOAT,
  growth_rate           FLOAT,
  engagement_velocity   FLOAT,
  cross_platform_count  INTEGER,
  posting_frequency     INTEGER,
  post_count            INTEGER,
  platforms             TEXT[],
  window_start          TIMESTAMPTZ,
  window_end            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Table: trend_posts (join) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trend_posts (
  trend_id  UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (trend_id, post_id)
);

-- ── Table: research_reports ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche                 TEXT NOT NULL,
  trend_id              UUID REFERENCES trends(id) ON DELETE CASCADE,
  brief_markdown        TEXT,
  key_hashtags          TEXT[],
  top_creators          TEXT[],
  recommended_resources JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_platform     ON posts (platform);
CREATE INDEX IF NOT EXISTS idx_posts_niche        ON posts (niche);
CREATE INDEX IF NOT EXISTS idx_posts_scraped_at   ON posts (scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_velocity     ON posts (velocity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_niche_scraped ON posts (niche, scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_trends_niche       ON trends (niche);
CREATE INDEX IF NOT EXISTS idx_trends_score       ON trends (trend_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_trends_created_at  ON trends (created_at DESC);

-- IVFFlat index for fast similarity search on post embeddings
CREATE INDEX IF NOT EXISTS idx_posts_embedding
  ON posts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE sources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;

-- Allow full access for the service role (used by API routes + ML service)
CREATE POLICY "Service role full access" ON sources
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON trends
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON trend_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON research_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous read access for the dashboard (uses anon key)
CREATE POLICY "Anon read posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Anon read trends" ON trends
  FOR SELECT USING (true);

CREATE POLICY "Anon read trend_posts" ON trend_posts
  FOR SELECT USING (true);

CREATE POLICY "Anon read research_reports" ON research_reports
  FOR SELECT USING (true);

CREATE POLICY "Anon read sources" ON sources
  FOR SELECT USING (true);
