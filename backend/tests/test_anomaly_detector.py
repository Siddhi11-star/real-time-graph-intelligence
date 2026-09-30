import pytest
from app.engine.anomaly_detector import ExplainableAnomalyDetector
from app.models.schemas import StreamEvent

def test_anomaly_lateral_movement():
    detector = ExplainableAnomalyDetector()
    evt = StreamEvent(
        id="test-anom-1",
        timestamp="19:10:00",
        source="dev-ws-charlie",
        source_type="Device",
        relationship="connected_to",
        target="dev-db01",
        target_type="Device",
        risk_score=20.0
    )
    is_anom, alert = detector.inspect_event(evt)
    assert is_anom is True
    assert alert is not None
    assert "Lateral Movement" in alert.title
    assert alert.severity == "critical"

def test_anomaly_credential_stuffing():
    detector = ExplainableAnomalyDetector()
    evt = StreamEvent(
        id="test-anom-2",
        timestamp="19:10:05",
        source="ip-threat-actor",
        source_type="IP",
        relationship="connected_to",
        target="dev-gw01",
        target_type="Device",
        risk_score=15.0
    )
    is_anom, alert = detector.inspect_event(evt)
    assert is_anom is True
    assert alert is not None
    assert "Credential Stuffing" in alert.title

def test_anomaly_dns_tunneling():
    detector = ExplainableAnomalyDetector()
    evt = StreamEvent(
        id="test-anom-3",
        timestamp="19:10:10",
        source="10.0.5.21",
        source_type="IP",
        relationship="requested",
        target="dom-c2-dark",
        target_type="Domain",
        risk_score=10.0
    )
    is_anom, alert = detector.inspect_event(evt)
    assert is_anom is True
    assert alert is not None
    assert "C2" in alert.title or "Exfiltration" in alert.title
