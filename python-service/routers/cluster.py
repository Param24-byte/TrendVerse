from fastapi import APIRouter, HTTPException
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
from models import ClusterRequest, ClusterResponse, ClusterSummary
from db import supabase
from datetime import datetime, timedelta, timezone
import numpy as np
import uuid

router = APIRouter(prefix="/cluster", tags=["clustering"])


def compute_trend_score(
    growth_rate: float,
    engagement_velocity: float,
    cross_platform_count: int,
    post_frequency: int,
) -> float:
    """
    Weighted trend score formula:
      growth_rate (40%) + engagement_velocity (30%) + cross_platform (20%) + post_freq (10%)
    All components are normalised to a 0-100 scale before weighting.
    """
    # Normalize each component to 0-100
    # growth_rate: ratio of current window vs previous, capped at 5x = 100
    gr_norm = min(growth_rate * 20, 100)
    # engagement_velocity: avg velocity_score, cap at 500 → 100
    ev_norm = min(engagement_velocity / 5, 100)
    # cross_platform: max 4 platforms (github, hn, ph, hf)
    cp_norm = min(cross_platform_count / 4 * 100, 100)
    # post_frequency: cap at 50 posts → 100
    pf_norm = min(post_frequency / 50 * 100, 100)

    score = (
        gr_norm * 0.40
        + ev_norm * 0.30
        + cp_norm * 0.20
        + pf_norm * 0.10
    )
    return round(score, 2)


@router.post("", response_model=ClusterResponse)
async def cluster_posts(req: ClusterRequest):
    """
    Cluster posts for a niche into trend groups using KMeans.
    Computes a trend_score for each cluster and writes results to Supabase.
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=req.window_hours)
    prev_window_start = window_start - timedelta(hours=req.window_hours)

    # ── Fetch posts with embeddings ───────────────────────────────────────────
    result = supabase.table("posts").select(
        "id, platform, title, caption, hashtags, engagement_count, velocity_score, posted_at, scraped_at, embedding"
    ).eq("niche", req.niche).gte(
        "scraped_at", window_start.isoformat()
    ).not_.is_("embedding", "null").execute()

    posts = result.data or []

    if len(posts) < 3:
        return ClusterResponse(
            clusters_created=0,
            niche=req.niche,
            error=f"Insufficient data: only {len(posts)} embedded posts found (need ≥3)",
        )

    # ── Build embedding matrix ────────────────────────────────────────────────
    import json
    parsed_embeddings = []
    for p in posts:
        emb = p["embedding"]
        if isinstance(emb, str):
            emb = json.loads(emb)
        parsed_embeddings.append(emb)

    embeddings = np.array(parsed_embeddings, dtype=np.float32)
    embeddings = normalize(embeddings)

    # ── Fetch previous window posts for growth rate ───────────────────────────
    prev_result = supabase.table("posts").select("id, platform").eq(
        "niche", req.niche
    ).gte("scraped_at", prev_window_start.isoformat()).lt(
        "scraped_at", window_start.isoformat()
    ).execute()
    prev_posts = prev_result.data or []
    total_prev = max(len(prev_posts), 1)

    # ── KMeans clustering ─────────────────────────────────────────────────────
    k = max(1, min(req.n_clusters, len(posts) // 2))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(embeddings)

    # Fetch existing trends from the last 24 hours to deduplicate
    yesterday = (now - timedelta(hours=24)).isoformat()
    existing_result = supabase.table("trends").select("id, cluster_label").eq("niche", req.niche).gte("created_at", yesterday).execute()
    existing_trends = existing_result.data or []

    created_trends: list[ClusterSummary] = []

    for cluster_id in range(k):
        cluster_indices = [i for i, lbl in enumerate(labels) if lbl == cluster_id]
        if not cluster_indices:
            continue

        cluster_posts = [posts[i] for i in cluster_indices]
        cluster_embeddings = embeddings[cluster_indices]
        centroid = kmeans.cluster_centers_[cluster_id]

        # Representative post: closest to centroid
        distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
        rep_idx = int(np.argmin(distances))
        rep_post = cluster_posts[rep_idx]

        # Try to find a real title — first from the representative post,
        # then scan all cluster posts for one with a non-placeholder title
        UNTITLED_MARKERS = {"untitled", "untitled trend", "untitled scraped post", ""}
        
        def is_good_title(t):
            t = t.strip().lower()
            return t not in UNTITLED_MARKERS and len(t.split()) >= 3

        rep_title = rep_post.get("title") or rep_post.get("caption") or ""
        if not is_good_title(rep_title):
            # Scan other posts in the cluster for a real title
            for p in sorted(cluster_posts, key=lambda x: x.get("engagement_count", 0) or 0, reverse=True):
                candidate = p.get("title") or p.get("caption") or ""
                if is_good_title(candidate):
                    rep_title = candidate
                    break
            # Fallback if no good title > 3 words is found
            if not is_good_title(rep_title):
                for p in cluster_posts:
                    candidate = p.get("title") or p.get("caption") or ""
                    if candidate.strip().lower() not in UNTITLED_MARKERS:
                        rep_title = candidate
                        break

        # Safety net: skip clusters that still have no usable title
        if rep_title.strip().lower() in UNTITLED_MARKERS:
            continue

        # Metrics
        from models import VALID_PLATFORMS
        platforms = list(set(p["platform"] for p in cluster_posts if p["platform"] in VALID_PLATFORMS))
        cross_platform_count = len(platforms)
        post_frequency = len(cluster_posts)

        velocities = [p.get("velocity_score") or 0 for p in cluster_posts]
        engagement_velocity = float(np.mean(velocities)) if velocities else 0.0

        # Growth rate: cluster posts this window vs expected from previous window
        prev_count = max(len(prev_posts) * (post_frequency / len(posts)), 1)
        growth_rate = post_frequency / prev_count

        trend_score = compute_trend_score(
            growth_rate, engagement_velocity, cross_platform_count, post_frequency
        )

        # ── Write trend to Supabase ───────────────────────────────────────────
        trend_data = {
            "niche": req.niche,
            "cluster_label": rep_title[:120],
            "representative_title": rep_title,
            "trend_score": trend_score,
            "growth_rate": round(growth_rate, 4),
            "engagement_velocity": round(engagement_velocity, 4),
            "cross_platform_count": cross_platform_count,
            "posting_frequency": post_frequency,
            "post_count": post_frequency,
            "platforms": platforms,
            "window_start": window_start.isoformat(),
            "window_end": now.isoformat(),
        }

        # Check for similar existing trend in the last 24 hours
        matched_trend_id = None
        new_words = set(rep_title[:120].lower().split())
        for et in existing_trends:
            et_words = set(et["cluster_label"].lower().split())
            if not et_words or not new_words:
                continue
            overlap = len(et_words.intersection(new_words))
            total_words = max(len(et_words), len(new_words), 1)
            # If >60% of words overlap, treat it as the same emerging topic
            if overlap / total_words > 0.6:
                matched_trend_id = et["id"]
                break

        if matched_trend_id:
            supabase.table("trends").update(trend_data).eq("id", matched_trend_id).execute()
            trend_id = matched_trend_id
            # Delete old post associations to rebuild them cleanly
            supabase.table("trend_posts").delete().eq("trend_id", trend_id).execute()
        else:
            trend_data["id"] = f"trend-{uuid.uuid4().hex[:12]}"
            trend_result = supabase.table("trends").insert(trend_data).execute()
            trend_id = trend_result.data[0]["id"]

        # ── Write trend_posts join rows ───────────────────────────────────────
        join_rows = [{"trend_id": trend_id, "post_id": p["id"]} for p in cluster_posts]
        supabase.table("trend_posts").insert(join_rows).execute()

        created_trends.append(
            ClusterSummary(
                id=trend_id,
                cluster_label=rep_title[:120],
                representative_title=rep_title,
                trend_score=trend_score,
                growth_rate=round(growth_rate, 4),
                post_count=post_frequency,
                platforms=platforms,
                created_at=now,
            )
        )

    top_trend = max(created_trends, key=lambda t: t.trend_score) if created_trends else None

    return ClusterResponse(
        clusters_created=len(created_trends),
        niche=req.niche,
        top_trend=top_trend,
    )
