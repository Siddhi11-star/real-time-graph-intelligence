import os
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.models.schemas import (
    GraphSnapshot, 
    ShortestPathRequest, 
    ShortestPathResponse, 
    ScenarioRequest
)
from app.engine.graph_engine import graph_engine
from app.services.stream_service import stream_service
from app.services.dataset_parser import DatasetParser
from app.models.database import get_db, AnomalyRecord, EventRecord

router = APIRouter(prefix="/graph", tags=["Graph Operations"])

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_datasets")

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

@router.post("/ingest/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    mode: str = Query("batch", pattern="^(batch|stream)$")
):
    """
    Ingest real external datasets (CSV, JSON, NDJSON, or Zeek log files).
    - mode='batch': Instantly processes and merges all events into the graph.
    - mode='stream': Sequentially replays events through the live streaming pipeline.
    """
    content = await file.read()
    events = DatasetParser.parse_file(file.filename, content)

    if not events:
        raise HTTPException(status_code=400, detail="Could not parse any valid graph events from file.")

    anomalies_count = 0

    if mode == "batch":
        for evt in events:
            if evt.is_anomaly:
                anomalies_count += 1
            await stream_service._dispatch_event(evt)
    else:
        # Stream mode: launch background playback
        async def replay_events():
            for evt in events:
                await stream_service._dispatch_event(evt)
                await asyncio.sleep(0.6)
        asyncio.create_task(replay_events())

    return {
        "status": "success",
        "filename": file.filename,
        "events_count": len(events),
        "anomalies_count": anomalies_count,
        "mode": mode,
        "message": f"Successfully parsed {len(events)} events from {file.filename}."
    }

@router.post("/ingest/sample/{sample_name}")
async def ingest_sample_dataset(
    sample_name: str,
    mode: str = Query("batch", pattern="^(batch|stream)$")
):
    """Ingest one of the bundled sample datasets (enterprise_auth, zeek_conn, dns_tunneling)."""
    mapping = {
        "enterprise_auth": "enterprise_auth.csv",
        "zeek_conn": "zeek_network_conn.log",
        "dns_tunneling": "dns_exfiltration.json"
    }

    if sample_name not in mapping:
        raise HTTPException(
            status_code=404, 
            detail=f"Sample '{sample_name}' not found. Available samples: {list(mapping.keys())}"
        )

    file_path = os.path.join(SAMPLE_DIR, mapping[sample_name])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail=f"Sample file {mapping[sample_name]} missing on server.")

    with open(file_path, "rb") as f:
        content = f.read()

    events = DatasetParser.parse_file(mapping[sample_name], content)
    anomalies_count = 0

    if mode == "batch":
        for evt in events:
            if evt.is_anomaly:
                anomalies_count += 1
            await stream_service._dispatch_event(evt)
    else:
        async def replay_events():
            for evt in events:
                await stream_service._dispatch_event(evt)
                await asyncio.sleep(0.6)
        asyncio.create_task(replay_events())

    return {
        "status": "success",
        "sample": sample_name,
        "filename": mapping[sample_name],
        "events_count": len(events),
        "anomalies_count": anomalies_count,
        "mode": mode
    }
