import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Boolean, Text, DateTime, Integer, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Engine configuration
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class EventRecord(Base):
    __tablename__ = "events"

    id = Column(String(100), primary_key=True, index=True)
    timestamp = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String(150), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)
    relationship = Column(String(50), nullable=False, index=True)
    target = Column(String(150), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    risk_score = Column(Float, default=10.0)
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")

    def set_metadata(self, data: dict):
        self.metadata_json = json.dumps(data)

    def get_metadata(self) -> dict:
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

class AnomalyRecord(Base):
    __tablename__ = "anomalies"

    id = Column(String(100), primary_key=True, index=True)
    timestamp = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String(200), nullable=False)
    entity_id = Column(String(150), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    score = Column(Float, nullable=False)
    status = Column(String(30), default="open", index=True)
    notes = Column(Text, nullable=True)
    reasons_json = Column(Text, default="[]")
    metrics_json = Column(Text, default="{}")

    def set_reasons(self, reasons: list):
        self.reasons_json = json.dumps(reasons)

    def get_reasons(self) -> list:
        try:
            return json.loads(self.reasons_json)
        except Exception:
            return []

    def set_metrics(self, metrics: dict):
        self.metrics_json = json.dumps(metrics)

    def get_metrics(self) -> dict:
        try:
            return json.loads(self.metrics_json)
        except Exception:
            return {}

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE anomalies ADD COLUMN status VARCHAR(30) DEFAULT 'open'"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE anomalies ADD COLUMN notes TEXT"))
            conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
