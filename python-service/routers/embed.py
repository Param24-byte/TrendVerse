from fastapi import APIRouter, HTTPException
from sentence_transformers import SentenceTransformer
from models import EmbedBatchRequest, EmbedBatchResponse
from db import supabase
from typing import Optional
import numpy as np

router = APIRouter(prefix="/embed", tags=["embeddings"])

# Load model once at module level (cached after first load)
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None

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
    texts_to_embed = []
    valid_posts = []
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

        texts_to_embed.append(embed_text)
        valid_posts.append(post)

    if valid_posts:
        model = get_model()
        # Generate embeddings in a single batch
        vectors = model.encode(texts_to_embed, normalize_embeddings=True)
        
        # Perform individual updates to avoid violating NOT NULL constraints on other fields on upsert
        for idx, post in enumerate(valid_posts):
            supabase.table("posts").update({
                "embedding": vectors[idx].tolist()
            }).eq("id", post["id"]).execute()
        embedded = len(valid_posts)
    else:
        embedded = 0

    return EmbedBatchResponse(embedded=embedded, skipped=skipped, niche=req.niche)
