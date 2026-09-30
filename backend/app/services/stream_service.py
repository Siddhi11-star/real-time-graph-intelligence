import asyncio
import datetime
import time
import random
import logging
from typing import Optional
from app.config import settings
from app.models.schemas import StreamEvent
from app.engine.graph_engine import graph_engine
from app.engine.anomaly_detector import anomaly_detector
from app.services.websocket_manager import ws_manager
from app.models.database import SessionLocal, EventRecord, AnomalyRecord

logger = logging.getLogger("stream_service")

NORMAL_TRAFFIC_PAIRS = [
    ("usr-bob", "User", "logged_in_to", "dev-ws-alice", "Device", "Dev remote pairing"),
    ("dev-ws-alice", "Device", "connected_to", "ip-public-dns", "IP", "DNS lookup 1.1.1.1"),
    ("ip-internal-gw", "IP", "requested", "dom-github", "Domain", "GitHub API sync"),
    ("dev-dc01", "Device", "spawned", "proc-svchost", "Process", "Service maintenance"),
    ("usr-admin", "User", "accessed", "sess-ssh-88", "Session", "SSH maintenance session"),
    ("dev-db01", "Device", "connected_to", "ip-internal-gw", "IP", "Database heartbeat"),
    ("usr-alice", "User", "accessed", "sess-vpn-01", "Session", "VPN keepalive"),
]

class EventStreamService:
    def __init__(self):
        self.is_running = True
        self.event_counter = int(time.time() * 100) % 10000000
        self.tick_seconds = settings.STREAM_TICK_SECONDS
        self._task: Optional[asyncio.Task] = None

    def start(self):
        if not self._task or self._task.done():
            self.is_running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("Event stream loop started.")

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Event stream loop stopped.")

    def _get_time_str(self) -> str:
        return datetime.datetime.now().strftime("%H:%M:%S")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.generate_normal_event()
                await asyncio.sleep(self.tick_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in stream loop: {e}")
                await asyncio.sleep(2)

    async def generate_normal_event(self):
        self.event_counter += 1
        s, st, r, t, tt, desc = random.choice(NORMAL_TRAFFIC_PAIRS)
        timestamp = self._get_time_str()

        event = StreamEvent(
            id=f"evt-{self.event_counter}",
            timestamp=timestamp,
            source=s,
            source_type=st,
            relationship=r,
            target=t,
            target_type=tt,
            risk_score=random.uniform(5.0, 22.0),
            is_anomaly=False,
            metadata={"description": desc}
        )

        await self._dispatch_event(event)

    async def inject_scenario(self, scenario_type: str):
        self.event_counter += 1
        timestamp = self._get_time_str()

        if scenario_type == "lateral_movement":
            evt1 = StreamEvent(
                id=f"evt-{self.event_counter}-lat1",
                timestamp=timestamp,
                source="dev-ws-charlie",
                source_type="Device",
                relationship="connected_to",
                target="dev-db01",
                target_type="Device",
                risk_score=89.0,
                is_anomaly=True,
                anomaly_reason="Lateral pivot violation: Sales host bypassing gateway to prod database cluster.",
                metadata={"port": 445, "protocol": "SMBv2", "segmentViolation": True}
            )
            await self._dispatch_event(evt1)

            # Step 2: Child process spawned
            await asyncio.sleep(0.8)
            self.event_counter += 1
            evt2 = StreamEvent(
                id=f"evt-{self.event_counter}-lat2",
                timestamp=self._get_time_str(),
                source="dev-db01",
                source_type="Device",
                relationship="spawned",
                target="proc-powershell",
                target_type="Process",
                risk_score=94.0,
                is_anomaly=True,
                anomaly_reason="Suspicious child process spawned on database server following lateral connection.",
                metadata={"cmdline": "powershell.exe -NoP -NonI -W Hidden -Enc ..."}
            )
            await self._dispatch_event(evt2)

        elif scenario_type == "credential_stuffing":
            evt = StreamEvent(
                id=f"evt-{self.event_counter}-stuffing",
                timestamp=timestamp,
                source="ip-threat-actor",
                source_type="IP",
                relationship="connected_to",
                target="dev-gw01",
                target_type="Device",
                risk_score=92.0,
                is_anomaly=True,
                anomaly_reason="High-frequency authentication burst (140+ req/s) from bulletproof IP range.",
                metadata={"attemptsPerSec": 142, "asn": "AS44050"}
            )
            await self._dispatch_event(evt)

        elif scenario_type == "dns_exfil":
            evt = StreamEvent(
                id=f"evt-{self.event_counter}-exfil",
                timestamp=timestamp,
                source="dev-ws-charlie",
                source_type="Device",
                relationship="requested",
                target="dom-c2-dark",
                target_type="Domain",
                risk_score=98.0,
                is_anomaly=True,
                anomaly_reason="High entropy Base64 TXT payloads beaconing to malicious C2 domain.",
                metadata={"entropy": 4.92, "recordType": "TXT", "payloadSize": "4.8MB"}
            )
            await self._dispatch_event(evt)

        elif scenario_type == "privilege_escalation":
            evt = StreamEvent(
                id=f"evt-{self.event_counter}-priv",
                timestamp=timestamp,
                source="usr-guest",
                source_type="User",
                relationship="authenticated_as",
                target="usr-admin",
                target_type="User",
                risk_score=88.0,
                is_anomaly=True,
                anomaly_reason="Contractor account elevated directly to Global Administrator via token manipulation.",
                metadata={"technique": "T1134 Access Token Manipulation", "eventCode": 4672}
            )
            await self._dispatch_event(evt)

    async def _dispatch_event(self, event: StreamEvent):
        # 1. Inspect for anomalies
        is_anom, alert = anomaly_detector.inspect_event(event)
        if is_anom and not event.is_anomaly:
            event.is_anomaly = True
            if alert and alert.reasons:
                event.anomaly_reason = alert.reasons[0]

        # 2. Update NetworkX dynamic graph
        graph_engine.process_stream_event(event)

        # 3. Persist to Database asynchronously
        db = None
        try:
            db = SessionLocal()
            evt_rec = EventRecord(
                id=event.id,
                timestamp=event.timestamp,
                source=event.source,
                source_type=event.source_type,
                relationship=event.relationship,
                target=event.target,
                target_type=event.target_type,
                risk_score=event.risk_score,
                is_anomaly=event.is_anomaly,
                anomaly_reason=event.anomaly_reason,
            )
            evt_rec.set_metadata(event.metadata)
            db.merge(evt_rec)

            if alert:
                anom_rec = AnomalyRecord(
                    id=alert.id,
                    timestamp=alert.timestamp,
                    title=alert.title,
                    entity_id=alert.entity_id,
                    entity_type=alert.entity_type,
                    severity=alert.severity,
                    score=alert.score
                )
                anom_rec.set_reasons(alert.reasons)
                anom_rec.set_metrics(alert.metrics.model_dump())
                db.merge(anom_rec)

            db.commit()
        except Exception as e:
            if db:
                db.rollback()
            logger.warning(f"Database write skipped: {e}")
        finally:
            if db:
                db.close()

        # 4. Broadcast live packet to connected WebSocket frontend clients
        await ws_manager.broadcast_event(
            event.model_dump(),
            alert.model_dump() if alert else None
        )

    async def bulk_dispatch_events(self, events: list) -> int:
        """
        Ingest a batch of events with optimized batch DB writes,
        graph updates, and WebSocket notification.
        """
        anomalies_count = 0
        db = None
        try:
            db = SessionLocal()
            for event in events:
                is_anom, alert = anomaly_detector.inspect_event(event)
                if is_anom and not event.is_anomaly:
                    event.is_anomaly = True
                    if alert and alert.reasons:
                        event.anomaly_reason = alert.reasons[0]
                if event.is_anomaly:
                    anomalies_count += 1

                # Update in-memory graph
                graph_engine.process_stream_event(event)

                # Persist event
                evt_rec = EventRecord(
                    id=event.id,
                    timestamp=event.timestamp,
                    source=event.source,
                    source_type=event.source_type,
                    relationship=event.relationship,
                    target=event.target,
                    target_type=event.target_type,
                    risk_score=event.risk_score,
                    is_anomaly=event.is_anomaly,
                    anomaly_reason=event.anomaly_reason,
                )
                evt_rec.set_metadata(event.metadata)
                db.merge(evt_rec)

                if alert:
                    anom_rec = AnomalyRecord(
                        id=alert.id,
                        timestamp=alert.timestamp,
                        title=alert.title,
                        entity_id=alert.entity_id,
                        entity_type=alert.entity_type,
                        severity=alert.severity,
                        score=alert.score
                    )
                    anom_rec.set_reasons(alert.reasons)
                    anom_rec.set_metrics(alert.metrics.model_dump())
                    db.merge(anom_rec)

            db.commit()
        except Exception as e:
            if db:
                db.rollback()
            logger.warning(f"Bulk database write error: {e}")
        finally:
            if db:
                db.close()

        # Broadcast updated snapshot so all WebSocket clients update instantly
        try:
            snapshot = graph_engine.get_snapshot()
            await ws_manager.broadcast_snapshot(snapshot)
        except Exception as e:
            logger.warning(f"Failed to broadcast snapshot: {e}")

        # Trigger ML model retraining in background if substantial dataset ingested
        if len(events) >= 5:
            try:
                from app.engine.ml_detector import ml_detector
                loop = asyncio.get_event_loop()
                loop.run_in_executor(None, ml_detector.train_and_predict)
            except Exception:
                pass

        return anomalies_count

stream_service = EventStreamService()
