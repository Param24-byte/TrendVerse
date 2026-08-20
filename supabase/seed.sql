-- ============================================================
-- TrendVerse — Seed Data
-- Run after 001_initial_schema.sql
-- ============================================================

INSERT INTO sources (platform, niche, config) VALUES
  ('github',      'ai-tools', '{"language": "all", "since": "daily"}'),
  ('hackernews',  'ai-tools', '{"pages": 2}'),
  ('producthunt', 'ai-tools', '{"category": "artificial-intelligence"}'),
  ('huggingface', 'ai-tools', '{"filter": "trending", "task": "text-generation"}'),
  ('devto',       'ai-tools', '{"tag": "ai", "top": 7}'),
  ('github',      'web-development', '{"language": "javascript", "since": "daily"}'),
  ('hackernews',  'web-development', '{"pages": 2}'),
  ('producthunt', 'web-development', '{"category": "developer-tools"}')
ON CONFLICT DO NOTHING;
