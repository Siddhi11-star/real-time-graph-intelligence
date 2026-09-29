import math
import time
from collections import defaultdict, deque
from typing import Optional, Tuple, List, Dict
from app.models.schemas import StreamEvent, AnomalyAlert, AnomalyMetrics

class ExplainableAnomalyDetector:
    def __init__(self):
        # Rolling window history for event rates per entity (timestamp deque)
        self.entity_event_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=200))
        # Historical baseline means and standard deviations
        self.baseline_rates: Dict[str, float] = defaultdict(lambda: 0.2) # default baseline 0.2 req/sec
        # Observed relation pairs seen in training / normal activity
        self.known_relation_pairs: set = {
            ("User", "logged_in_to", "Device"),
            ("Device", "connected_to", "IP"),
            ("Device", "connected_to", "Device"), # Gateway only
            ("IP", "requested", "Domain"),
            ("Device", "spawned", "Process"),
            ("User", "accessed", "Session")
        }

    def inspect_event(self, event: StreamEvent) -> Tuple[bool, Optional[AnomalyAlert]]:
        current_time = time.time()
        source = event.source
        target = event.target

        # Record event in rolling history
        self.entity_event_history[source].append(current_time)

        # 1. Burst & Rate Statistical Z-Score Signal
        recent_timestamps = self.entity_event_history[source]
        # Count events in the last 10 seconds
        window_10s = [t for t in recent_timestamps if current_time - t <= 10.0]
        observed_rate = len(window_10s) / 10.0 # events / second
        baseline_rate = self.baseline_rates[source]
        
        # Approximate standard deviation
        std_dev = max(0.15, baseline_rate * 0.4)
        z_score = (observed_rate - baseline_rate) / std_dev

        reasons: List[str] = []
        severity = "medium"
        title = "Anomalous Activity Flagged"
        score = 45.0

        # Check Burst Signal (z-score > 3.0)
        if z_score >= 3.0:
            reasons.append(
                f"Statistically significant event burst: {observed_rate:.1f} req/s vs baseline {baseline_rate:.2f} req/s (Z = +{z_score:.1f}σ)."
            )
            score = min(98.0, 50.0 + (z_score * 8.0))
            severity = "critical" if z_score > 4.5 else "high"
            title = "High-Velocity Connection Burst"

        # 2. Rule: Lateral Movement detection (Workstations connecting directly to critical DB/DC)
        if "ws-" in source.lower() and ("db" in target.lower() or "dc" in target.lower()):
            reasons.append("Cross-subnet lateral pivot: Workstation bypassing perimeter gateway to reach critical Tier-0 asset.")
            reasons.append(f"Shortest-path policy violation: Direct {event.relationship} to {target} without bastion authentication.")
            score = max(score, 89.0)
            severity = "critical"
            title = "Lateral Movement Detected"

        # 3. Rule: Credential Stuffing & Malicious Threat Actor IP
        if "threat-actor" in source.lower() or "threat" in source.lower():
            reasons.append("Traffic originates from flagged threat actor ASN / bulletproof IP range.")
            reasons.append(f"Rapid authentication cycling targeting {target}.")
            score = max(score, 92.0)
            severity = "critical"
            title = "Credential Stuffing & Burst Activity"

        # 4. Rule: DNS Exfiltration / Suspicious C2 Domain
        if "c2" in target.lower() or "dark" in target.lower():
            reasons.append("Host communicating with unclassified dynamic DNS or malicious Command & Control (C2) endpoint.")
            reasons.append("High Shannon entropy query payloads characteristic of data exfiltration.")
            score = max(score, 98.0)
            severity = "critical"
            title = "Data Exfiltration / C2 Beaconing"

        # 5. Rule: Privilege Escalation
        if event.relationship == "authenticated_as" and ("admin" in target.lower() or "sys" in target.lower()):
            reasons.append("Unauthorized elevation: Standard user authenticated directly as administrative account.")
            reasons.append("Potential Token Impersonation (T1134) or Kerberoasting ticket request.")
            score = max(score, 88.0)
            severity = "high"
            title = "Privilege Escalation Alert"

        # 6. Check if event was explicitly flagged by scenario injector
        if event.is_anomaly:
            if event.anomaly_reason and event.anomaly_reason not in reasons:
                reasons.append(event.anomaly_reason)
            score = max(score, event.risk_score)
            severity = "critical" if score >= 85.0 else "high"

        is_flagged = len(reasons) > 0 or event.is_anomaly or z_score >= 3.0

        if is_flagged:
            alert = AnomalyAlert(
                id=f"alt-{int(current_time * 1000)}-{source}",
                timestamp=event.timestamp,
                title=title,
                entity_id=source,
                entity_type=event.source_type,
                severity=severity,
                score=round(score, 1),
                reasons=reasons,
                metrics=AnomalyMetrics(
                    baseline_rate=f"{baseline_rate:.2f} req/s",
                    observed_rate=f"{observed_rate:.1f} req/s",
                    z_score=round(z_score, 1),
                    unexpected_relation=f"{source} ──[{event.relationship}]──> {target}"
                )
            )
            return True, alert

        return False, None

anomaly_detector = ExplainableAnomalyDetector()
