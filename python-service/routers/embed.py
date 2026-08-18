from fastapi import APIRouter, HTTPException
from sentence_transformers import SentenceTransformer
from models import EmbedBatchRequest, EmbedBatchResponse
from db import supabase
import numpy as np

router = APIRouter(prefix="/embed", tags=["embeddings"])

# Load model once at module level (cached after first load)
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


@router.post("/batch", response_model=EmbedBatchResponse)
async def embed_batch(req: EmbedBatchRequest):
    """
    Embed posts for a given niche (or specific post_ids).
    Fetches posts from Supabase, generates sentence embeddings,
    and writes them back to posts.embedding.
    """
    # ── Fetch posts ───────────────────────────────────────────────────────────
    query = supabase.table("posts").select(
        "id, title, caption, hashtags"
    ).eq("niche", req.niche)

    if req.post_ids:
        query = query.in_("id", req.post_ids)
    else:
        # Only embed posts that don't have embeddings yet
        query = query.is_("embedding", "null")

    result = query.execute()
    posts = result.data or []

    if not posts:
        return EmbedBatchResponse(embedded=0, skipped=0, niche=req.niche)

    model = get_model()
    embedded = 0
    skipped = 0

    for post in posts:
        # Build the text to embed
        title = post.get("title") or ""
        caption = post.get("caption") or ""
        hashtags = " ".join(post.get("hashtags") or [])
        embed_text = f"{title} {caption} {hashtags}".strip()

        if not embed_text:
            skipped += 1
            continue

        # Generate embedding (384-dim vector)
        vector = model.encode(embed_text, normalize_embeddings=True)
        vector_list = vector.tolist()

        # Update Supabase
        supabase.table("posts").update(
            {"embedding": vector_list}
        ).eq("id", post["id"]).execute()

        embedded += 1

    return EmbedBatchResponse(embedded=embedded, skipped=skipped, niche=req.niche)
