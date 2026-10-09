import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import (
    onboarding_router,
    chapters_router,
    graph_router,
    assessment_router,
    chat_router,
    user_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("forgehacks")

app = FastAPI(
    title="Tessera Cognitive Compiler API",
    description="Backend API powering causal DAG extraction, BKT Bayesian knowledge tracing, and 3-Gate Agentic RCA.",
    version="1.0.0"
)

# CORS Middleware
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(onboarding_router)
app.include_router(chapters_router)
app.include_router(graph_router)
app.include_router(assessment_router)
app.include_router(chat_router)
app.include_router(user_router)

@app.get("/")
async def root():
    return {
        "platform": "Tessera Cognitive Compiler",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.api_route("/api/sync", methods=["GET", "POST", "OPTIONS"])
async def sync():
    return {"status": "synced"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
