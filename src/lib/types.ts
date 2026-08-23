// ─── Shared TypeScript types for TrendVerse ───────────────────────────────────

export const VALID_PLATFORMS = [
  "github",
  "hackernews",
  "producthunt",
  "huggingface",
  "devto",
  "reddit",
  "stackexchange"
] as const;

export type Platform = typeof VALID_PLATFORMS[number];

export interface Source {
  id: string;
  platform: Platform;
  niche: string;
  config: Record<string, unknown> | null;
  last_scraped_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  source_id: string | null;
  platform: Platform;
  niche: string;
  title: string | null;
  caption: string | null;
  url: string | null;
  creator: string | null;
  hashtags: string[] | null;
  engagement_count: number | null;
  engagement_breakdown: Record<string, number> | null;
  rank_position: number | null;
  velocity_score: number | null;
  posted_at: string | null;
  scraped_at: string;
}

export interface Trend {
  id: string;
  niche: string;
  cluster_label: string | null;
  representative_title: string | null;
  trend_score: number | null;
  growth_rate: number | null;
  engagement_velocity: number | null;
  cross_platform_count: number | null;
  posting_frequency: number | null;
  post_count: number | null;
  platforms: Platform[] | null;
  window_start: string | null;
  window_end: string | null;
  created_at: string;
  research_brief?: string;
  trend_posts?: Array<{ posts: { url: string | null } }>;
}

export interface TrendPost {
  trend_id: string;
  post_id: string;
}

export interface ResearchReport {
  id: string;
  niche: string;
  trend_id: string | null;
  brief_markdown: string | null;
  key_hashtags: string[] | null;
  top_creators: string[] | null;
  recommended_resources: Array<{ title: string; url: string }> | null;
  created_at: string;
}

// ─── Niche definitions ────────────────────────────────────────────────────────
export const NICHES = [
  { id: "ai-tools", label: "AI & Machine Learning", lucideIcon: "Bot" },
  { id: "web-development", label: "Web Development", lucideIcon: "Globe" },
  { id: "devops-cloud", label: "DevOps & Cloud", lucideIcon: "Cloud" },
  { id: "open-source", label: "Open Source", lucideIcon: "Code" },
  { id: "blockchain", label: "Blockchain & Web3", lucideIcon: "Link" },
] as const;

export type NicheId = (typeof NICHES)[number]["id"];

// ─── Platform metadata ────────────────────────────────────────────────────────
export const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; badgeClass: string; emoji: string }
> = {
  github:       { label: "GitHub",       color: "#8b5cf6", badgeClass: "badge-github",      emoji: "" },
  hackernews:   { label: "Hacker News",  color: "#f59e0b", badgeClass: "badge-hackernews",  emoji: "" },
  producthunt:  { label: "Product Hunt", color: "#f43f5e", badgeClass: "badge-producthunt", emoji: "" },
  huggingface:  { label: "Hugging Face", color: "#22d3ee", badgeClass: "badge-huggingface", emoji: "" },
  devto:        { label: "Dev.to",       color: "#6366f1", badgeClass: "badge-devto",       emoji: "" },
  reddit:       { label: "Reddit",       color: "#f97316", badgeClass: "badge-reddit",       emoji: "" },
  stackexchange:{ label: "Stack Exchange", color: "#f59e0b", badgeClass: "badge-hackernews", emoji: "" },
};

// ─── API response types ───────────────────────────────────────────────────────
export interface ScraperRunResult {
  success: boolean;
  platform: Platform;
  posts_inserted: number;
  error?: string;
}

export interface RunAllResult {
  niche: string;
  results: ScraperRunResult[];
  total_posts: number;
  duration_ms: number;
}

export interface EmbedResult {
  embedded: number;
  skipped: number;
  niche: string;
}

export interface ClusterResult {
  clusters_created: number;
  niche: string;
  top_trend?: {
    id: string;
    cluster_label: string;
    trend_score: number;
  };
  error?: string;
}
