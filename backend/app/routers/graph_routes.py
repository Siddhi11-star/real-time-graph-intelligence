from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.schemas import (
    GraphSnapshot, 
    ShortestPathRequest, 
    ShortestPathResponse, 
    ScenarioRequest
)
from app.engine.graph_engine import graph_engine
from app.services.stream_service import stream_service
from app.models.database import get_db, AnomalyRecord, EventRecord

router = APIRouter(prefix="/graph", tags=["Graph Operations"])

@router.get("/snapshot", response_model=GraphSnapshot)
def get_graph_snapshot():
    """Retrieve full dynamic graph snapshot with nodes, edges, and statistics."""
    return graph_engine.get_snapshot()

@router.get("/analytics")
def get_graph_analytics():
    """Retrieve computed PageRank, Degree Centralities, Communities, and Cycles."""
    return graph_engine.compute_topological_metrics()

@router.post("/shortest-path", response_model=ShortestPathResponse)
def compute_shortest_path(request: ShortestPathRequest):
    """Compute BFS / Dijkstra shortest traversal path between two network nodes."""
    return graph_engine.find_shortest_path(request.source_id, request.target_id)

@router.post("/scenarios/inject")
async def inject_scenario(payload: ScenarioRequest):
    """Trigger a realistic cybersecurity attack scenario."""
    await stream_service.inject_scenario(payload.scenario)
    return {"status": "success", "scenario": payload.scenario}

@router.post("/stream/toggle")
def toggle_stream(action: str = Query(..., pattern="^(pause|resume)$")):
    """Pause or resume the real-time event ingestion stream."""
    if action == "pause":
        stream_service.stop()
    else:
        stream_service.start()
    return {"status": "success", "is_running": stream_service.is_running}

@router.post("/stream/speed")
def change_stream_speed(tick_seconds: float = Query(..., gt=0.05, le=10.0)):
    """Configure streaming event tick frequency."""
    stream_service.tick_seconds = tick_seconds
    return {"status": "success", "tick_seconds": tick_seconds}

@router.get("/anomalies/history")
def get_anomalies_history(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve historical anomaly detection records from persistence."""
    records = db.query(AnomalyRecord).order_by(AnomalyRecord.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "title": r.title,
            "entity_id": r.entity_id,
            "entity_type": r.entity_type,
            "severity": r.severity,
            "score": r.score,
            "reasons": r.get_reasons(),
            "metrics": r.get_metrics(),
        }
        for r in records
    ]
