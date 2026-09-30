import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

def test_graph_snapshot(client):
    res = client.get("/api/graph/snapshot")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert "stats" in data

def test_query_nodes(client):
    res = client.get("/api/graph/nodes?type=Device")
    assert res.status_code == 200
    nodes = res.json()
    assert all(n["type"] == "Device" for n in nodes)

def test_node_detail_and_neighborhood(client):
    res_det = client.get("/api/graph/nodes/dev-dc01")
    assert res_det.status_code == 200
    data_det = res_det.json()
    assert data_det["node"]["id"] == "dev-dc01"
    assert "neighbors" in data_det

    res_nbh = client.get("/api/graph/nodes/dev-dc01/neighborhood?hops=1")
    assert res_nbh.status_code == 200
    data_nbh = res_nbh.json()
    assert data_nbh["center_node_id"] == "dev-dc01"
    assert len(data_nbh["nodes"]) >= 2

def test_shortest_path_endpoint(client):
    res = client.post("/api/graph/shortest-path", json={
        "source_id": "usr-admin",
        "target_id": "dev-db01"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert len(data["path"]) == 3

def test_anomalies_stats_and_history(client):
    res_stats = client.get("/api/graph/anomalies/stats")
    assert res_stats.status_code == 200
    data_stats = res_stats.json()
    assert "total_incidents" in data_stats
    assert "by_severity" in data_stats

    res_hist = client.get("/api/graph/anomalies/history?limit=10")
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert isinstance(data_hist, list)

def test_ml_anomalies(client):
    res = client.get("/api/graph/ml/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert data["trained"] is True
    assert "anomalies_flagged" in data

def test_forensic_reports(client):
    res_summary = client.get("/api/graph/reports/forensic-summary")
    assert res_summary.status_code == 200
    data_summary = res_summary.json()
    assert "executive_summary" in data_summary

    res_pdf = client.get("/api/graph/reports/forensic-pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 1000
