from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import HealthResponse
from routers import embed, cluster, trends

app = FastAPI(
    title="TrendVerse ML Service",
    description="Embedding, clustering, and trend scoring for TrendVerse",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(embed.router)
app.include_router(cluster.router)
app.include_router(trends.router)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    return HealthResponse(
        status="ok",
        model="sentence-transformers/all-MiniLM-L6-v2",
    )
