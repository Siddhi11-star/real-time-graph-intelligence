from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field

EntityType = Literal['User', 'Device', 'IP', 'Domain', 'Process', 'Session']
RelationshipType = Literal[
    'logged_in_to', 
    'connected_to', 
    'requested', 
    'spawned', 
    'authenticated_as', 
    'accessed'
]
SeverityType = Literal['critical', 'high', 'medium', 'low']

class StreamEvent(BaseModel):
    id: str
    timestamp: str
    source: str
    source_type: EntityType
    relationship: RelationshipType
    target: str
    target_type: EntityType
    risk_score: float = Field(default=10.0, ge=0.0, le=100.0)
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AnomalyMetrics(BaseModel):
    baseline_rate: Optional[str] = None
    observed_rate: Optional[str] = None
    z_score: Optional[float] = None
    unexpected_relation: Optional[str] = None

class AnomalyAlert(BaseModel):
    id: str
    timestamp: str
    title: str
    entity_id: str
    entity_type: EntityType
    severity: SeverityType
    score: float
    reasons: List[str]
    metrics: AnomalyMetrics = Field(default_factory=AnomalyMetrics)

class GraphNode(BaseModel):
    id: str
    label: str
    type: EntityType
    risk_score: float = 10.0
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None
    degree: int = 0
    in_degree: int = 0
    out_degree: int = 0
    pagerank: float = 0.0
    betweenness: float = 0.0
    community_id: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: RelationshipType
    timestamp: str
    weight: float = 1.0
    is_anomaly: bool = False
    anomaly_score: float = 0.0

class GraphSnapshot(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any]

class ShortestPathRequest(BaseModel):
    source_id: str
    target_id: str

class ShortestPathResponse(BaseModel):
    found: bool
    path: List[str]
    edge_ids: List[str]
    distance: int

class ScenarioRequest(BaseModel):
    scenario: Literal['lateral_movement', 'credential_stuffing', 'dns_exfil', 'privilege_escalation']
