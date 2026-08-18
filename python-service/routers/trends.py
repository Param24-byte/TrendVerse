from fastapi import APIRouter, HTTPException, Query
from models import TrendResponse
from db import supabase
from typing import List

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("/{niche}", response_model=List[TrendResponse])
async def get_trends(
    niche: str,
    limit: int = Query(default=10, ge=1, le=50),
):
    """
    Return the latest trends for a given niche, ordered by trend_score DESC.
    """
    result = supabase.table("trends").select("*").eq(
        "niche", niche
    ).order("trend_score", desc=True).limit(limit).execute()

    trends = result.data or []
    if not trends:
        raise HTTPException(status_code=404, detail=f"No trends found for niche: {niche}")

    return trends
