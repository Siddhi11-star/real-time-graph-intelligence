import csv
import json
import io
import re
import datetime
from typing import List, Dict, Any, Tuple
from app.models.schemas import StreamEvent, EntityType, RelationshipType

IP_REGEX = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
DOMAIN_REGEX = re.compile(r"^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$")

SOURCE_ALIASES = ["source", "src", "src_ip", "source_ip", "user", "username", "id.orig_h", "orig_h", "client", "caller"]
TARGET_ALIASES = ["target", "dst", "dst_ip", "dest_ip", "device", "host", "domain", "query", "id.resp_h", "resp_h", "server", "destination"]
RELATION_ALIASES = ["relationship", "relation", "action", "event_type", "proto", "service", "type", "operation", "method"]

def infer_entity_type(val: str, default: EntityType = "Device") -> EntityType:
    val_clean = str(val).strip()
    if IP_REGEX.match(val_clean):
        return "IP"
    if DOMAIN_REGEX.match(val_clean) or any(tld in val_clean for tld in [".com", ".net", ".org", ".io", ".internal", ".xyz"]):
        return "Domain"
    if val_clean.lower().endswith(".exe") or "pid:" in val_clean.lower() or "/bin/" in val_clean:
        return "Process"
    if val_clean.lower().startswith("usr-") or any(kw in val_clean.lower() for kw in ["admin", "alice", "bob", "charlie", "user", "guest"]):
        return "User"
    if val_clean.lower().startswith("sess-") or "vpn" in val_clean.lower() or "ssh" in val_clean.lower():
        return "Session"
    return default

def infer_relationship_type(val: str) -> RelationshipType:
    val_clean = str(val).strip().lower().replace("-", "_").replace(" ", "_")
    valid_rels = ["logged_in_to", "connected_to", "requested", "spawned", "authenticated_as", "accessed"]
    if val_clean in valid_rels:
        return val_clean # type: ignore

    if any(kw in val_clean for kw in ["login", "logon", "auth"]):
        return "logged_in_to"
    if any(kw in val_clean for kw in ["dns", "http", "query", "req", "lookup"]):
        return "requested"
    if any(kw in val_clean for kw in ["exec", "spawn", "fork", "start", "proc"]):
        return "spawned"
    if any(kw in val_clean for kw in ["priv", "escalat", "elevat", "sudo"]):
        return "authenticated_as"
    if any(kw in val_clean for kw in ["access", "open", "read", "vpn", "ssh"]):
        return "accessed"

    return "connected_to"

class DatasetParser:
    @staticmethod
    def parse_file(filename: str, content_bytes: bytes) -> List[StreamEvent]:
        text_content = content_bytes.decode("utf-8", errors="replace").strip()
        lower_name = filename.lower()

        if lower_name.endswith(".json") or lower_name.endswith(".ndjson"):
            return DatasetParser.parse_json(text_content)
        elif lower_name.endswith(".log") or "#fields" in text_content[:500]:
            return DatasetParser.parse_zeek_log(text_content)
        else:
            return DatasetParser.parse_csv(text_content)

    @staticmethod
    def parse_csv(text_content: str) -> List[StreamEvent]:
        events: List[StreamEvent] = []
        reader = csv.DictReader(io.StringIO(text_content))
        if not reader.fieldnames:
            return events

        # Map header columns
        header_map: Dict[str, str] = {}
        for col in reader.fieldnames:
            col_lower = col.strip().lower()
            if not header_map.get("source") and any(a == col_lower for a in SOURCE_ALIASES):
                header_map["source"] = col
            elif not header_map.get("target") and any(a == col_lower for a in TARGET_ALIASES):
                header_map["target"] = col
            elif not header_map.get("relationship") and any(a == col_lower for a in RELATION_ALIASES):
                header_map["relationship"] = col

        # Fallback if specific headers not found
        field_list = list(reader.fieldnames)
        if not header_map.get("source") and len(field_list) >= 1:
            header_map["source"] = field_list[0]
        if not header_map.get("target") and len(field_list) >= 2:
            header_map["target"] = field_list[1]
        if not header_map.get("relationship") and len(field_list) >= 3:
            header_map["relationship"] = field_list[2]

        now = datetime.datetime.now()
        for idx, row in enumerate(reader, start=1):
            src_val = str(row.get(header_map.get("source", ""), f"node_{idx}_a")).strip()
            tgt_val = str(row.get(header_map.get("target", ""), f"node_{idx}_b")).strip()
            rel_val = str(row.get(header_map.get("relationship", ""), "connected_to")).strip()

            if not src_val or not tgt_val:
                continue

            rel_type = infer_relationship_type(rel_val)
            src_type = infer_entity_type(src_val, "Device")
            tgt_type = infer_entity_type(tgt_val, "Device" if rel_type == "connected_to" else "Domain")

            time_str = (now + datetime.timedelta(seconds=idx * 2)).strftime("%H:%M:%S")

            # Check explicit anomaly or risk score in row
            risk_score = 15.0
            for rk in ["risk", "risk_score", "score", "threat_score"]:
                if rk in row and row[rk]:
                    try:
                        risk_score = float(row[rk])
                    except ValueError:
                        pass

            is_anomaly = risk_score > 70.0 or any(
                str(v).lower() in ["anomaly", "alert", "malicious", "attack", "true", "1"] 
                for k, v in row.items() if "label" in k.lower() or "anomaly" in k.lower() or "alert" in k.lower()
            )

            metadata = {k: v for k, v in row.items() if k not in header_map.values()}

            events.append(StreamEvent(
                id=f"upload-evt-{idx}",
                timestamp=time_str,
                source=src_val,
                source_type=src_type,
                relationship=rel_type,
                target=tgt_val,
                target_type=tgt_type,
                risk_score=risk_score,
                is_anomaly=is_anomaly,
                anomaly_reason="Flagged during dataset ingest: high risk baseline violation." if is_anomaly else None,
                metadata=metadata
            ))

        return events

    @staticmethod
    def parse_json(text_content: str) -> List[StreamEvent]:
        events: List[StreamEvent] = []
        raw_items: List[Dict[str, Any]] = []

        try:
            # Try parsing as standard JSON Array
            parsed = json.loads(text_content)
            if isinstance(parsed, list):
                raw_items = parsed
            elif isinstance(parsed, dict):
                raw_items = [parsed]
        except json.JSONDecodeError:
            # Try parsing as NDJSON (newline-delimited JSON)
            for line in text_content.splitlines():
                line = line.strip()
                if line:
                    try:
                        raw_items.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass

        now = datetime.datetime.now()
        for idx, item in enumerate(raw_items, start=1):
            src_val = item.get("source") or item.get("src") or item.get("src_ip") or item.get("user") or item.get("id.orig_h")
            tgt_val = item.get("target") or item.get("dst") or item.get("dst_ip") or item.get("device") or item.get("domain") or item.get("id.resp_h")
            rel_val = item.get("relationship") or item.get("proto") or item.get("event_type") or item.get("action") or "connected_to"

            if not src_val or not tgt_val:
                continue

            rel_type = infer_relationship_type(str(rel_val))
            src_type = item.get("source_type") or infer_entity_type(str(src_val), "Device")
            tgt_type = item.get("target_type") or infer_entity_type(str(tgt_val), "Device")

            time_str = item.get("timestamp") or (now + datetime.timedelta(seconds=idx * 2)).strftime("%H:%M:%S")
            risk_score = float(item.get("risk_score", 15.0))
            is_anomaly = bool(item.get("is_anomaly", risk_score > 70.0))

            events.append(StreamEvent(
                id=str(item.get("id", f"upload-json-{idx}")),
                timestamp=str(time_str),
                source=str(src_val),
                source_type=src_type,
                relationship=rel_type,
                target=str(tgt_val),
                target_type=tgt_type,
                risk_score=risk_score,
                is_anomaly=is_anomaly,
                anomaly_reason=item.get("anomaly_reason"),
                metadata=item.get("metadata", {})
            ))

        return events

    @staticmethod
    def parse_zeek_log(text_content: str) -> List[StreamEvent]:
        events: List[StreamEvent] = []
        fields = []
        lines = text_content.splitlines()

        for line in lines:
            line = line.strip()
            if line.startswith("#fields"):
                fields = line.split()[1:]
                continue
            if line.startswith("#") or not line:
                continue

            parts = line.split("\t" if "\t" in line else None)
            if fields and len(parts) >= len(fields):
                row = dict(zip(fields, parts))
            else:
                continue

            src = row.get("id.orig_h") or row.get("orig_h")
            dst = row.get("id.resp_h") or row.get("resp_h") or row.get("query")
            proto = row.get("proto") or row.get("service") or "tcp"

            if not src or not dst:
                continue

            rel_type = infer_relationship_type(proto)
            src_type = infer_entity_type(src, "IP")
            tgt_type = infer_entity_type(dst, "IP")

            events.append(StreamEvent(
                id=f"zeek-{len(events) + 1}",
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                source=src,
                source_type=src_type,
                relationship=rel_type,
                target=dst,
                target_type=tgt_type,
                risk_score=10.0,
                is_anomaly=False,
                metadata={"proto": proto, "orig_p": row.get("id.orig_p"), "resp_p": row.get("id.resp_p")}
            ))

        return events
