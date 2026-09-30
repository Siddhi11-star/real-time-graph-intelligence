import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.database import init_db
from app.routers import graph_routes, ws_routes
from app.services.stream_service import stream_service
from app.engine.graph_engine import graph_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB, rehydrate graph state, and start real-time event generator
    logger.info("Initializing persistence database...")
    init_db()
    logger.info("Rehydrating graph engine topology from persistence...")
    graph_engine.rehydrate_from_db()
    logger.info("Starting background event stream worker...")
    stream_service.start()
    yield
    # Shutdown: Stop stream worker
    logger.info("Shutting down stream worker...")
    stream_service.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Real-Time Graph Intelligence Platform with Dynamic Graph Engine, Explainable Anomalies, and WebSockets",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(graph_routes.router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_routes.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "ws_endpoint": "/ws/events"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
