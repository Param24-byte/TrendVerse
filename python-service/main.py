from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv("../.env.local")
except ImportError:
    pass

from models import HealthResponse
from routers import embed, cluster, trends

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="TrendVerse ML Service",
    description="Embedding, clustering, and trend scoring for TrendVerse",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Read allowed origins from env; fallback to localhost for dev
allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", "")
site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "")

origins = ["http://localhost:3000", "http://localhost:3001"]
if site_url and site_url not in origins:
    origins.append(site_url)
for o in allowed_origins_str.split(","):
    o = o.strip()
    if o and o not in origins:
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    secret = os.environ.get("INTERNAL_API_SECRET") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if secret and credentials.credentials != secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    return credentials.credentials

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(embed.router, dependencies=[Depends(verify_token)])
app.include_router(cluster.router, dependencies=[Depends(verify_token)])
app.include_router(trends.router, dependencies=[Depends(verify_token)])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["health"])
@limiter.limit("60/minute")
async def health(request: Request):
    return HealthResponse(
        status="ok",
        model="sentence-transformers/all-MiniLM-L6-v2",
    )
