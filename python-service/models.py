from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Constants ─────────────────────────────────────────────────────────────────
VALID_PLATFORMS = [
    "github",
    "hackernews",
    "producthunt",
    "huggingface",
    "devto",
    "reddit",
    "stackexchange"
]

# ─── Request Models ────────────────────────────────────────────────────────────

class EmbedBatchRequest(BaseModel):
    niche: str
    post_ids: Optional[List[str]] = Field(default=None, description="If empty, embeds all un-embedded posts for the niche")

class ClusterRequest(BaseModel):
    niche: str
    window_hours: int = Field(default=24, ge=1, le=168)
    n_clusters: int = Field(default=8, ge=2, le=20)


# ─── Response Models ───────────────────────────────────────────────────────────

class EmbedBatchResponse(BaseModel):
    embedded: int
    skipped: int
    niche: str

class ClusterSummary(BaseModel):
    id: str
    cluster_label: str
    representative_title: str
    trend_score: float
    growth_rate: float
    post_count: int
    platforms: List[str]
    created_at: datetime

class ClusterResponse(BaseModel):
    clusters_created: int
    niche: str
    top_trend: Optional[ClusterSummary] = None
    error: Optional[str] = None

class TrendResponse(BaseModel):
    id: str
    niche: str
    cluster_label: str
    representative_title: str
    trend_score: float
    growth_rate: float
    engagement_velocity: float
    cross_platform_count: int
    posting_frequency: int
    post_count: int
    platforms: List[str]
    window_start: Optional[datetime]
    window_end: Optional[datetime]
    created_at: datetime

class HealthResponse(BaseModel):
    status: str
    model: str
    version: str = "1.0.0"
