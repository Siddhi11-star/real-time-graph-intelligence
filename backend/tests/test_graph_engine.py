import pytest
from app.engine.graph_engine import NetworkGraphEngine
from app.models.schemas import StreamEvent

def test_graph_initialization():
    engine = NetworkGraphEngine()
    snapshot = engine.get_snapshot()
    assert len(snapshot["nodes"]) >= 20
    assert len(snapshot["edges"]) >= 10
    assert snapshot["stats"]["node_count"] == len(snapshot["nodes"])

def test_add_node_and_edge():
    engine = NetworkGraphEngine()
    engine.add_node("test-node-1", "Test Node", "Device", risk_score=45.0, timestamp="19:00:00")
    engine.add_node("test-node-2", "Test Node 2", "IP", risk_score=10.0, timestamp="19:00:05")
    engine.add_edge("e-test-1", "test-node-1", "test-node-2", "connected_to", "19:00:10", 15.0)

    node = engine.get_node("test-node-1")
    assert node is not None
    assert node.risk_score == 45.0
    assert node.first_seen == "19:00:00"
    assert node.last_seen == "19:00:00"

def test_shortest_path():
    engine = NetworkGraphEngine()
    # usr-admin -> dev-dc01 -> dev-db01
    res = engine.find_shortest_path("usr-admin", "dev-db01")
    assert res.found is True
    assert len(res.path) == 3
    assert res.path[0] == "usr-admin"
    assert res.path[-1] == "dev-db01"
    assert res.distance == 2

def test_neighborhood():
    engine = NetworkGraphEngine()
    nbh = engine.get_neighborhood("dev-dc01", hops=1, direction="both")
    assert nbh["center_node_id"] == "dev-dc01"
    assert len(nbh["nodes"]) >= 2
    assert len(nbh["edges"]) >= 1

def test_filter_nodes():
    engine = NetworkGraphEngine()
    users = engine.filter_nodes(node_type="User")
    assert all(u.type == "User" for u in users)

    high_risk = engine.filter_nodes(min_risk=50.0)
    assert all(n.risk_score >= 50.0 for n in high_risk)
