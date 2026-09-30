import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
from app.models.schemas import (
    GraphNode, 
    GraphEdge, 
    StreamEvent, 
    ShortestPathResponse,
    EntityType,
    RelationshipType
)

class NetworkGraphEngine:
    def __init__(self):
        # Directed multigraph for realistic cybersecurity flows
        self.graph = nx.MultiDiGraph()
        self.node_metadata: Dict[str, Dict[str, Any]] = {}
        self.edge_records: Dict[str, Dict[str, Any]] = {}
        self._load_baseline_topology()

    def _load_baseline_topology(self):
        baseline_nodes = [
            ("usr-admin", "admin_sys", "User", 15.0, {"department": "IT-Security", "role": "GlobalAdmin"}),
            ("usr-alice", "alice_sec", "User", 10.0, {"department": "SOC-Team", "role": "Analyst"}),
            ("usr-bob", "bob_dev", "User", 20.0, {"department": "Engineering", "role": "DevOps"}),
            ("usr-charlie", "charlie_sales", "User", 35.0, {"department": "Sales", "role": "Executive"}),
            ("usr-guest", "guest_contractor", "User", 55.0, {"department": "Vendor", "role": "Contractor"}),
            ("dev-dc01", "DC-PRIMARY-01", "Device", 12.0, {"os": "Windows Server 2022", "subnet": "10.0.1.0/24"}),
            ("dev-db01", "PROD-DB-CLUSTER", "Device", 15.0, {"os": "Ubuntu 24.04", "subnet": "10.0.2.0/24"}),
            ("dev-ws-alice", "WS-ALICE-M3", "Device", 8.0, {"os": "macOS 15", "subnet": "10.0.5.0/24"}),
            ("dev-ws-charlie", "WS-CHARLIE-PC", "Device", 65.0, {"os": "Windows 11", "subnet": "10.0.5.0/24"}),
            ("dev-gw01", "BORDER-GW-01", "Device", 25.0, {"os": "FortiOS", "subnet": "172.16.0.0/16"}),
            ("ip-internal-gw", "10.0.0.1", "IP", 5.0, {"zone": "Internal-Gateway"}),
            ("ip-cloud-auth", "52.96.165.2", "IP", 8.0, {"provider": "Microsoft Azure"}),
            ("ip-threat-actor", "194.26.29.112", "IP", 92.0, {"country": "RU", "asn": "AS44050"}),
            ("ip-public-dns", "1.1.1.1", "IP", 5.0, {"provider": "Cloudflare"}),
            ("dom-internal", "corp.internal.net", "Domain", 5.0, {"registrar": "Internal"}),
            ("dom-github", "api.github.com", "Domain", 10.0, {"category": "Developer Tools"}),
            ("dom-c2-dark", "sync-telemetry-cdn.xyz", "Domain", 96.0, {"category": "Malicious C2"}),
            ("proc-svchost", "svchost.exe (pid:1042)", "Process", 5.0, {"path": "C:\\Windows\\System32"}),
            ("proc-powershell", "powershell.exe (pid:4901)", "Process", 82.0, {"path": "C:\\Windows\\System32\\WindowsPowerShell"}),
            ("proc-ssh", "sshd: worker-node (pid:812)", "Process", 12.0, {"path": "/usr/sbin/sshd"}),
            ("sess-vpn-01", "VPN-TNL-9921", "Session", 18.0, {"cipher": "AES-256-GCM"}),
            ("sess-ssh-88", "SSH-PROD-ADM", "Session", 30.0, {"auth": "ed25519-key"}),
        ]

        for nid, lbl, ntype, risk, meta in baseline_nodes:
            self.add_node(nid, lbl, ntype, risk, meta)

        baseline_edges = [
            ("e1", "usr-admin", "dev-dc01", "logged_in_to", "18:20:00", 10.0),
            ("e2", "usr-alice", "dev-ws-alice", "logged_in_to", "18:21:15", 5.0),
            ("e3", "usr-charlie", "dev-ws-charlie", "logged_in_to", "18:22:10", 40.0),
            ("e4", "dev-ws-alice", "ip-internal-gw", "connected_to", "18:22:45", 5.0),
            ("e5", "dev-ws-charlie", "dev-gw01", "connected_to", "18:23:00", 25.0),
            ("e6", "dev-dc01", "dev-db01", "connected_to", "18:23:30", 12.0),
            ("e7", "dev-gw01", "ip-cloud-auth", "connected_to", "18:24:00", 8.0),
            ("e8", "ip-internal-gw", "dom-internal", "requested", "18:24:20", 5.0),
            ("e9", "dev-ws-alice", "proc-svchost", "spawned", "18:24:40", 5.0),
            ("e10", "dev-db01", "proc-ssh", "spawned", "18:25:00", 10.0),
            ("e11", "usr-admin", "sess-vpn-01", "accessed", "18:25:10", 10.0),
        ]

        for eid, s, t, rel, ts, risk in baseline_edges:
            self.add_edge(eid, s, t, rel, ts, risk)

    def add_node(
        self, 
        node_id: str, 
        label: str, 
        node_type: EntityType, 
        risk_score: float = 10.0, 
        metadata: Optional[Dict[str, Any]] = None,
        is_anomaly: bool = False,
        anomaly_reason: Optional[str] = None,
        timestamp: Optional[str] = None
    ):
        ts = timestamp or "18:20:00"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id, 
                label=label, 
                type=node_type, 
                risk_score=risk_score,
                is_anomaly=is_anomaly,
                anomaly_reason=anomaly_reason,
                first_seen=ts,
                last_seen=ts
            )
            self.node_metadata[node_id] = metadata or {}
        else:
            # Update attributes
            curr_risk = self.graph.nodes[node_id].get("risk_score", 10.0)
            self.graph.nodes[node_id]["risk_score"] = max(curr_risk, risk_score)
            self.graph.nodes[node_id]["last_seen"] = ts
            if not self.graph.nodes[node_id].get("first_seen"):
                self.graph.nodes[node_id]["first_seen"] = ts
            if is_anomaly:
                self.graph.nodes[node_id]["is_anomaly"] = True
                if anomaly_reason:
                    self.graph.nodes[node_id]["anomaly_reason"] = anomaly_reason
            if metadata:
                self.node_metadata[node_id].update(metadata)

    def add_edge(
        self, 
        edge_id: str, 
        source: str, 
        target: str, 
        relationship: RelationshipType, 
        timestamp: str, 
        risk_score: float = 10.0,
        is_anomaly: bool = False
    ):
        # Ensure endpoints exist
        if not self.graph.has_node(source):
            self.add_node(source, source, "Device", risk_score)
        if not self.graph.has_node(target):
            self.add_node(target, target, "Device", risk_score)

        self.graph.add_edge(
            source, 
            target, 
            key=edge_id, 
            label=relationship, 
            timestamp=timestamp, 
            risk_score=risk_score,
            is_anomaly=is_anomaly
        )
        self.edge_records[edge_id] = {
            "id": edge_id,
            "source": source,
            "target": target,
            "label": relationship,
            "timestamp": timestamp,
            "is_anomaly": is_anomaly,
            "risk_score": risk_score
        }

    def process_stream_event(self, event: StreamEvent):
        # Update graph with incoming event
        self.add_node(
            event.source, 
            event.source, 
            event.source_type, 
            event.risk_score, 
            event.metadata,
            event.is_anomaly,
            event.anomaly_reason,
            timestamp=event.timestamp
        )
        self.add_node(
            event.target, 
            event.target, 
            event.target_type, 
            event.risk_score, 
            event.metadata,
            event.is_anomaly,
            event.anomaly_reason,
            timestamp=event.timestamp
        )
        edge_id = f"e-{event.id}"
        self.add_edge(
            edge_id, 
            event.source, 
            event.target, 
            event.relationship, 
            event.timestamp, 
            event.risk_score,
            event.is_anomaly
        )

    def get_snapshot(self) -> Dict[str, Any]:
        nodes_list = []
        metrics = self.compute_topological_metrics()
        pr_scores = metrics.get("pagerank", {})
        comm_map = metrics.get("communities", {})

        for node_id in self.graph.nodes:
            n_data = self.graph.nodes[node_id]
            in_d = self.graph.in_degree(node_id)
            out_d = self.graph.out_degree(node_id)
            nodes_list.append(GraphNode(
                id=node_id,
                label=n_data.get("label", node_id),
                type=n_data.get("type", "Device"),
                risk_score=n_data.get("risk_score", 10.0),
                is_anomaly=n_data.get("is_anomaly", False),
                anomaly_reason=n_data.get("anomaly_reason"),
                degree=in_d + out_d,
                in_degree=in_d,
                out_degree=out_d,
                pagerank=pr_scores.get(node_id, 0.0),
                community_id=comm_map.get(node_id, 1),
                metadata=self.node_metadata.get(node_id, {}),
                first_seen=n_data.get("first_seen"),
                last_seen=n_data.get("last_seen")
            ))

        edges_list = []
        for eid, r in self.edge_records.items():
            edges_list.append(GraphEdge(
                id=eid,
                source=r["source"],
                target=r["target"],
                label=r["label"],
                timestamp=r["timestamp"],
                is_anomaly=r.get("is_anomaly", False),
                anomaly_score=r.get("risk_score", 0.0)
            ))

        stats = {
            "node_count": len(nodes_list),
            "edge_count": len(edges_list),
            "density": nx.density(self.graph) if len(nodes_list) > 1 else 0.0,
            "communities_count": len(set(comm_map.values())),
            "cycles_count": len(metrics.get("cycles", []))
        }

        return {
            "nodes": [n.model_dump() for n in nodes_list],
            "edges": [e.model_dump() for e in edges_list],
            "stats": stats
        }

    def compute_topological_metrics(self) -> Dict[str, Any]:
        n = self.graph.number_of_nodes()
        if n == 0:
            return {"degree_centrality": {}, "pagerank": {}, "communities": {}, "cycles": []}

        # 1. Degree Centrality
        deg_centrality = nx.degree_centrality(self.graph)

        # 2. PageRank
        try:
            pr = nx.pagerank(self.graph, alpha=0.85, max_iter=50)
            max_pr = max(pr.values()) if pr else 1.0
            norm_pr = {k: round(v / (max_pr or 1.0), 3) for k, v in pr.items()}
        except Exception:
            norm_pr = {node: 0.1 for node in self.graph.nodes}

        # 3. Community Detection (Modularity on undirected projection)
        communities_map: Dict[str, int] = {}
        try:
            undirected_g = nx.Graph(self.graph)
            comms = list(nx.community.greedy_modularity_communities(undirected_g))
            for idx, comm in enumerate(comms, start=1):
                for node in comm:
                    communities_map[node] = idx
        except Exception:
            for idx, node in enumerate(self.graph.nodes, start=1):
                communities_map[node] = 1

        # 4. Cycle Detection
        cycles: List[List[str]] = []
        try:
            # Simple cycles in DiGraph
            di_g = nx.DiGraph(self.graph)
            raw_cycles = list(nx.simple_cycles(di_g))
            cycles = [c + [c[0]] for c in raw_cycles[:5]]
        except Exception:
            cycles = []

        return {
            "degree_centrality": {k: round(v, 3) for k, v in deg_centrality.items()},
            "pagerank": norm_pr,
            "communities": communities_map,
            "cycles": cycles
        }

    def find_shortest_path(self, source_id: str, target_id: str) -> ShortestPathResponse:
        if not self.graph.has_node(source_id) or not self.graph.has_node(target_id):
            return ShortestPathResponse(found=False, path=[], edge_ids=[], distance=0)

        # Use undirected projection for cyber incident pathfinding
        undirected_g = nx.Graph(self.graph)
        try:
            path = nx.shortest_path(undirected_g, source=source_id, target=target_id)
            distance = len(path) - 1
            # Extract edge IDs
            edge_ids = []
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                for eid, e_rec in self.edge_records.items():
                    if (e_rec["source"] == u and e_rec["target"] == v) or (e_rec["source"] == v and e_rec["target"] == u):
                        edge_ids.append(eid)
                        break

            return ShortestPathResponse(
                found=True,
                path=path,
                edge_ids=edge_ids,
                distance=distance
            )
        except nx.NetworkXNoPath:
            return ShortestPathResponse(found=False, path=[], edge_ids=[], distance=0)

    def rehydrate_from_db(self):
        """Rebuild in-memory graph from persisted EventRecord entries on server boot."""
        from app.models.database import SessionLocal, EventRecord
        db = SessionLocal()
        try:
            records = db.query(EventRecord).order_by(EventRecord.created_at.asc()).limit(5000).all()
            for rec in records:
                self.add_node(
                    node_id=rec.source,
                    label=rec.source,
                    node_type=rec.source_type,
                    risk_score=rec.risk_score,
                    metadata=rec.get_metadata(),
                    is_anomaly=rec.is_anomaly,
                    anomaly_reason=rec.anomaly_reason,
                    timestamp=rec.timestamp
                )
                self.add_node(
                    node_id=rec.target,
                    label=rec.target,
                    node_type=rec.target_type,
                    risk_score=rec.risk_score,
                    metadata=rec.get_metadata(),
                    is_anomaly=rec.is_anomaly,
                    anomaly_reason=rec.anomaly_reason,
                    timestamp=rec.timestamp
                )
                edge_id = f"e-{rec.id}"
                self.add_edge(
                    edge_id=edge_id,
                    source=rec.source,
                    target=rec.target,
                    relationship=rec.relationship,
                    timestamp=rec.timestamp,
                    risk_score=rec.risk_score,
                    is_anomaly=rec.is_anomaly
                )
        except Exception as e:
            import logging
            logging.getLogger("graph_engine").warning(f"Graph rehydration failed: {e}")
        finally:
            db.close()

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Fetch details for a single node."""
        if not self.graph.has_node(node_id):
            return None
        n_data = self.graph.nodes[node_id]
        in_d = self.graph.in_degree(node_id)
        out_d = self.graph.out_degree(node_id)
        metrics = self.compute_topological_metrics()
        pr_scores = metrics.get("pagerank", {})
        comm_map = metrics.get("communities", {})

        return GraphNode(
            id=node_id,
            label=n_data.get("label", node_id),
            type=n_data.get("type", "Device"),
            risk_score=n_data.get("risk_score", 10.0),
            is_anomaly=n_data.get("is_anomaly", False),
            anomaly_reason=n_data.get("anomaly_reason"),
            degree=in_d + out_d,
            in_degree=in_d,
            out_degree=out_d,
            pagerank=pr_scores.get(node_id, 0.0),
            community_id=comm_map.get(node_id, 1),
            metadata=self.node_metadata.get(node_id, {}),
            first_seen=n_data.get("first_seen"),
            last_seen=n_data.get("last_seen")
        )

    def get_neighborhood(self, center_node_id: str, hops: int = 1, direction: str = 'both') -> Dict[str, Any]:
        """Extract k-hop ego-graph around an entity."""
        if not isinstance(direction, str) or direction not in ('in', 'out', 'both'):
            direction = 'both'
        if not isinstance(hops, int) or hops < 1:
            hops = 1

        if not self.graph.has_node(center_node_id):
            return {"center_node_id": center_node_id, "hops": hops, "nodes": [], "edges": []}

        visited_nodes = {center_node_id}
        frontier = {center_node_id}

        for _ in range(hops):
            next_frontier = set()
            for current in frontier:
                if direction in ('out', 'both'):
                    for _, target in self.graph.out_edges(current):
                        if target not in visited_nodes:
                            next_frontier.add(target)
                if direction in ('in', 'both'):
                    for source, _ in self.graph.in_edges(current):
                        if source not in visited_nodes:
                            next_frontier.add(source)
            visited_nodes.update(next_frontier)
            frontier = next_frontier
            if not frontier:
                break

        metrics = self.compute_topological_metrics()
        pr_scores = metrics.get("pagerank", {})
        comm_map = metrics.get("communities", {})

        sub_nodes = []
        for nid in visited_nodes:
            n_data = self.graph.nodes[nid]
            in_d = self.graph.in_degree(nid)
            out_d = self.graph.out_degree(nid)
            sub_nodes.append(GraphNode(
                id=nid,
                label=n_data.get("label", nid),
                type=n_data.get("type", "Device"),
                risk_score=n_data.get("risk_score", 10.0),
                is_anomaly=n_data.get("is_anomaly", False),
                anomaly_reason=n_data.get("anomaly_reason"),
                degree=in_d + out_d,
                in_degree=in_d,
                out_degree=out_d,
                pagerank=pr_scores.get(nid, 0.0),
                community_id=comm_map.get(nid, 1),
                metadata=self.node_metadata.get(nid, {}),
                first_seen=n_data.get("first_seen"),
                last_seen=n_data.get("last_seen")
            ))

        sub_edges = []
        for eid, r in self.edge_records.items():
            if r["source"] in visited_nodes and r["target"] in visited_nodes:
                sub_edges.append(GraphEdge(
                    id=eid,
                    source=r["source"],
                    target=r["target"],
                    label=r["label"],
                    timestamp=r["timestamp"],
                    is_anomaly=r.get("is_anomaly", False),
                    anomaly_score=r.get("risk_score", 0.0)
                ))

        return {
            "center_node_id": center_node_id,
            "hops": hops,
            "nodes": [n.model_dump() for n in sub_nodes],
            "edges": [e.model_dump() for e in sub_edges]
        }

    def filter_nodes(
        self,
        node_type: Optional[str] = None,
        min_risk: Optional[float] = None,
        is_anomaly: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[GraphNode]:
        """Query and filter nodes by type, risk score, anomaly status, or substring."""
        if not isinstance(node_type, str):
            node_type = None
        if not isinstance(min_risk, (int, float)):
            min_risk = None
        if not isinstance(is_anomaly, bool):
            is_anomaly = None
        if not isinstance(search, str):
            search = None

        snapshot = self.get_snapshot()
        nodes: List[Dict[str, Any]] = snapshot.get("nodes", [])
        filtered = []
        for n in nodes:
            if node_type and n["type"].lower() != node_type.lower():
                continue
            if min_risk is not None and n["risk_score"] < min_risk:
                continue
            if is_anomaly is not None and n["is_anomaly"] != is_anomaly:
                continue
            if search:
                s_lower = search.lower()
                if s_lower not in n["id"].lower() and s_lower not in n["label"].lower():
                    continue
            filtered.append(GraphNode(**n))
        return filtered

    def bulk_process_events(self, events: List[StreamEvent]):
        """Efficiently ingest a batch of StreamEvents into NetworkX."""
        for evt in events:
            self.process_stream_event(evt)

graph_engine = NetworkGraphEngine()
