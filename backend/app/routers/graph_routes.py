import os
import time
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.models.schemas import (
    GraphSnapshot,
    GraphNode,
    ShortestPathRequest, 
    ShortestPathResponse, 
    ScenarioRequest,
    AnomalyUpdateRequest,
    AnomalyResponse,
    EntityDetailResponse,
    NeighborhoodResponse
)
from app.engine.graph_engine import graph_engine
from app.engine.ml_detector import ml_detector
from app.services.stream_service import stream_service
from app.services.dataset_parser import DatasetParser
from app.services.report_generator import ForensicReportGenerator
from app.models.database import get_db, AnomalyRecord, EventRecord

router = APIRouter(prefix="/graph", tags=["Graph Operations"])

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_datasets")

@router.get("/snapshot", response_model=GraphSnapshot)
def get_graph_snapshot():
    """Retrieve full dynamic graph snapshot with nodes, edges, and statistics."""
    return graph_engine.get_snapshot()

@router.get("/nodes", response_model=List[GraphNode])
def query_nodes(
    type: Optional[str] = Query(default=None, description="Filter by node entity type"),
    min_risk: Optional[float] = Query(default=None, ge=0.0, le=100.0, description="Minimum risk score threshold"),
    is_anomaly: Optional[bool] = Query(default=None, description="Filter by anomaly status"),
    search: Optional[str] = Query(default=None, description="Substring search on node ID or label")
):
    """Filter nodes dynamically by entity type, threat score, anomaly flag, or search term."""
    return graph_engine.filter_nodes(
        node_type=type if isinstance(type, str) else None,
        min_risk=min_risk if isinstance(min_risk, (int, float)) else None,
        is_anomaly=is_anomaly if isinstance(is_anomaly, bool) else None,
        search=search if isinstance(search, str) else None
    )

@router.get("/nodes/{node_id}", response_model=EntityDetailResponse)
def get_node_detail(node_id: str, db: Session = Depends(get_db)):
    """Fetch complete entity details, 1-hop connected neighbors, and incident counts."""
    node = graph_engine.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Entity '{node_id}' not found in active graph.")

    neighborhood = graph_engine.get_neighborhood(node_id, hops=1, direction="both")
    incident_count = db.query(AnomalyRecord).filter(AnomalyRecord.entity_id == node_id).count()

    neighbor_nodes = [
        n for n in neighborhood.get("nodes", []) 
        if n.get("id") != node_id
    ]

    return {
        "node": node,
        "incident_count": incident_count,
        "neighbors": neighbor_nodes,
        "edges": neighborhood.get("edges", [])
    }

@router.get("/nodes/{node_id}/neighborhood", response_model=NeighborhoodResponse)
def get_node_neighborhood(
    node_id: str,
    hops: int = Query(default=1, ge=1, le=3, description="Neighborhood radius in hops (1-3)"),
    direction: str = Query(default="both", pattern="^(in|out|both)$", description="Edge traversal direction")
):
    """Extract k-hop ego-graph around an entity for forensic relationship investigation."""
    if not graph_engine.graph.has_node(node_id):
        raise HTTPException(status_code=404, detail=f"Entity '{node_id}' not found in active graph.")
    hops_val = hops if isinstance(hops, int) else 1
    dir_val = direction if isinstance(direction, str) else "both"
    return graph_engine.get_neighborhood(node_id, hops=hops_val, direction=dir_val)

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

@router.get("/anomalies/history", response_model=List[AnomalyResponse])
def get_anomalies_history(
    limit: int = 50,
    status: Optional[str] = Query(None, description="Filter by triage status (open, investigating, resolved, false_positive)"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    entity_id: Optional[str] = Query(None, description="Filter by target entity ID"),
    db: Session = Depends(get_db)
):
    """Retrieve historical anomaly detection records with optional status/severity filtering."""
    query = db.query(AnomalyRecord)
    if status:
        query = query.filter(AnomalyRecord.status == status)
    if severity:
        query = query.filter(AnomalyRecord.severity.ilike(severity))
    if entity_id:
        query = query.filter(AnomalyRecord.entity_id == entity_id)

    records = query.order_by(AnomalyRecord.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "title": r.title,
            "entity_id": r.entity_id,
            "entity_type": r.entity_type,
            "severity": r.severity,
            "score": r.score,
            "status": r.status or "open",
            "notes": r.notes,
            "reasons": r.get_reasons(),
            "metrics": r.get_metrics(),
        }
        for r in records
    ]

@router.patch("/anomalies/{anomaly_id}", response_model=AnomalyResponse)
def update_anomaly_status(
    anomaly_id: str,
    payload: AnomalyUpdateRequest,
    db: Session = Depends(get_db)
):
    """Triage and update incident status or analyst notes."""
    record = db.query(AnomalyRecord).filter(AnomalyRecord.id == anomaly_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Anomaly incident '{anomaly_id}' not found.")

    if payload.status:
        record.status = payload.status
    if payload.notes is not None:
        record.notes = payload.notes

    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "timestamp": record.timestamp,
        "title": record.title,
        "entity_id": record.entity_id,
        "entity_type": record.entity_type,
        "severity": record.severity,
        "score": record.score,
        "status": record.status or "open",
        "notes": record.notes,
        "reasons": record.get_reasons(),
        "metrics": record.get_metrics(),
    }

@router.get("/anomalies/stats")
def get_anomalies_stats(db: Session = Depends(get_db)):
    """Summary metrics of security incidents grouped by severity and triage status."""
    records = db.query(AnomalyRecord).all()
    total = len(records)
    by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    by_status = {"open": 0, "investigating": 0, "resolved": 0, "false_positive": 0}

    for r in records:
        sev = (r.severity or "medium").lower()
        if sev in by_severity:
            by_severity[sev] += 1
        st = (r.status or "open").lower()
        if st in by_status:
            by_status[st] += 1
        else:
            by_status[st] = by_status.get(st, 0) + 1

    return {
        "total_incidents": total,
        "by_severity": by_severity,
        "by_status": by_status,
        "unresolved_critical": sum(1 for r in records if (r.severity or "").lower() == "critical" and (r.status or "open") in ("open", "investigating"))
    }

@router.post("/ingest/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    mode: str = Query("batch", pattern="^(batch|stream)$")
):
    """
    Ingest real external datasets (CSV, JSON, NDJSON, or Zeek log files).
    - mode='batch': Instantly processes and merges all events into the graph with batch commit.
    - mode='stream': Sequentially replays events through the live streaming pipeline.
    """
    content = await file.read()
    events = DatasetParser.parse_file(file.filename, content)

    if not events:
        raise HTTPException(status_code=400, detail="Could not parse any valid graph events from file.")

    if mode == "batch":
        anomalies_count = await stream_service.bulk_dispatch_events(events)
    else:
        anomalies_count = 0
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

    if mode == "batch":
        anomalies_count = await stream_service.bulk_dispatch_events(events)
    else:
        anomalies_count = 0
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

@router.get("/ml/anomalies")
def get_ml_anomalies():
    """
    Run unsupervised scikit-learn Isolation Forest on node embedding features:
    (in_degree, out_degree, total_degree, pagerank, betweenness, relationship_entropy, risk_score).
    """
    return ml_detector.train_and_predict()

@router.post("/ml/retrain")
def retrain_ml_model(contamination: float = Query(0.15, gt=0.01, lt=0.5)):
    """Re-train the Isolation Forest model with specified contamination threshold."""
    ml_detector.contamination = contamination
    return ml_detector.train_and_predict()

@router.get("/reports/forensic-summary")
def get_forensic_summary_report():
    """Retrieve structured JSON Incident Forensic Summary report."""
    return ForensicReportGenerator.get_forensic_data()

@router.get("/reports/forensic-pdf")
def download_forensic_pdf():
    """Download compiled Incident Forensic Summary report as binary PDF."""
    data = ForensicReportGenerator.get_forensic_data()
    pdf_bytes = ForensicReportGenerator.generate_pdf(data)
    filename = f"incident_forensic_report_{int(time.time())}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

