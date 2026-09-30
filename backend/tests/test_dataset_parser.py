import pytest
from app.services.dataset_parser import DatasetParser

def test_parse_csv():
    csv_content = b"source,target,relationship,risk\nusr-test,dev-test,logged_in_to,85\n"
    events = DatasetParser.parse_file("test.csv", csv_content)
    assert len(events) == 1
    assert events[0].source == "usr-test"
    assert events[0].target == "dev-test"
    assert events[0].relationship == "logged_in_to"
    assert events[0].is_anomaly is True

def test_parse_json():
    json_content = b'[{"source": "10.0.0.5", "target": "google.com", "relationship": "requested", "risk_score": 10}]'
    events = DatasetParser.parse_file("test.json", json_content)
    assert len(events) == 1
    assert events[0].source == "10.0.0.5"
    assert events[0].target == "google.com"
    assert events[0].source_type == "IP"
    assert events[0].target_type == "Domain"

def test_parse_zeek_log():
    zeek_content = (
        b"#fields\tid.orig_h\tid.resp_h\tproto\tservice\n"
        b"192.168.1.50\t1.1.1.1\ttcp\tdns\n"
    )
    events = DatasetParser.parse_file("conn.log", zeek_content)
    assert len(events) == 1
    assert events[0].source == "192.168.1.50"
    assert events[0].target == "1.1.1.1"
