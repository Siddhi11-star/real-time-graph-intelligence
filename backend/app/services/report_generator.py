import io
import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.engine.graph_engine import graph_engine
from app.engine.ml_detector import ml_detector
from app.models.database import SessionLocal, AnomalyRecord, EventRecord

class ForensicReportGenerator:
    @staticmethod
    def get_forensic_data() -> Dict[str, Any]:
        """Aggregate real-time graph, anomaly, and ML intelligence for forensic reporting."""
        snapshot = graph_engine.get_snapshot()
        stats = snapshot.get("stats", {})
        nodes = snapshot.get("nodes", [])
        edges = snapshot.get("edges", [])

        # Fetch recent anomalies from database
        db = SessionLocal()
        try:
            records = db.query(AnomalyRecord).order_by(AnomalyRecord.created_at.desc()).limit(20).all()
            anomalies = [
                {
                    "id": r.id,
                    "timestamp": r.timestamp,
                    "title": r.title,
                    "entity_id": r.entity_id,
                    "entity_type": r.entity_type,
                    "severity": r.severity,
                    "score": r.score,
                    "reasons": r.get_reasons(),
                    "metrics": r.get_metrics(),
                }
                for r in records
            ]
        finally:
            db.close()

        # ML Isolation Forest Analysis
        ml_results = ml_detector.train_and_predict()

        high_risk_nodes = sorted(
            [n for n in nodes if n.get("risk_score", 0) >= 60 or n.get("is_anomaly") or n.get("is_anomalous")],
            key=lambda x: x.get("risk_score", 0),
            reverse=True
        )[:15]

        anomalous_count = sum(1 for n in nodes if n.get("is_anomaly") or n.get("is_anomalous") or n.get("risk_score", 0) >= 70)
        isolated_count = sum(1 for n in nodes if n.get("degree", 0) == 0)

        now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        return {
            "generated_at": now_utc,
            "report_title": "Real-Time Graph Intelligence Forensic Audit Report",
            "executive_summary": {
                "total_nodes": stats.get("node_count", len(nodes)),
                "total_edges": stats.get("edge_count", len(edges)),
                "anomalous_nodes_count": anomalous_count,
                "graph_density": stats.get("density", 0.0),
                "isolated_nodes": isolated_count,
                "critical_threat_count": sum(1 for a in anomalies if a.get("severity") in ("CRITICAL", "HIGH", "critical", "high")),
                "ml_flagged_count": ml_results.get("anomalies_flagged", 0) if ml_results.get("trained") else 0,
            },
            "high_risk_entities": high_risk_nodes,
            "incident_records": anomalies,
            "ml_anomaly_detection": {
                "algorithm": ml_results.get("algorithm", "Isolation Forest"),
                "total_evaluated": ml_results.get("total_nodes_evaluated", 0),
                "top_anomalies": ml_results.get("results", [])[:10] if ml_results.get("trained") else []
            }
        }

    @staticmethod
    def generate_pdf(data: Dict[str, Any]) -> bytes:
        """Render a formatted incident forensic summary PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=15
        )
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=12,
            spaceAfter=8
        )
        cell_style = ParagraphStyle(
            'CellStyle',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#334155')
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=cell_style,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor('#0f172a')
        )
        badge_crit = ParagraphStyle(
            'BadgeCrit',
            parent=cell_style,
            textColor=colors.HexColor('#dc2626'),
            fontName="Helvetica-Bold"
        )
        badge_warn = ParagraphStyle(
            'BadgeWarn',
            parent=cell_style,
            textColor=colors.HexColor('#ea580c'),
            fontName="Helvetica-Bold"
        )

        elements = []

        # Header Title
        elements.append(Paragraph("CYBER-INTELLIGENCE FORENSIC AUDIT", title_style))
        elements.append(Paragraph(f"Generated at: {data['generated_at']} | Platform: Real-Time Graph Intelligence Engine", subtitle_style))
        elements.append(Spacer(1, 8))

        # Executive Metrics Table
        exec_sum = data.get("executive_summary", {})
        summary_data = [
            [
                Paragraph("<b>Total Entities</b>", cell_bold), Paragraph(str(exec_sum.get("total_nodes", 0)), cell_style),
                Paragraph("<b>Active Connections</b>", cell_bold), Paragraph(str(exec_sum.get("total_edges", 0)), cell_style)
            ],
            [
                Paragraph("<b>Threat Nodes (High/Crit)</b>", cell_bold), Paragraph(str(exec_sum.get("anomalous_nodes_count", 0)), badge_crit),
                Paragraph("<b>Graph Density</b>", cell_bold), Paragraph(f"{exec_sum.get('graph_density', 0.0):.4f}", cell_style)
            ],
            [
                Paragraph("<b>Critical Incident Events</b>", cell_bold), Paragraph(str(exec_sum.get("critical_threat_count", 0)), badge_crit),
                Paragraph("<b>ML Isolation Forest Outliers</b>", cell_bold), Paragraph(str(exec_sum.get("ml_flagged_count", 0)), badge_warn)
            ]
        ]
        sum_table = Table(summary_data, colWidths=[140, 130, 140, 130])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 14))

        # Section: High-Risk Flagged Entities
        elements.append(Paragraph("1. High-Risk Nodes & Potential Compromises", section_style))
        high_risk = data.get("high_risk_entities", [])
        if high_risk:
            node_table_rows = [
                [Paragraph("<b>Node ID / IP</b>", cell_bold), Paragraph("<b>Type</b>", cell_bold), Paragraph("<b>Risk</b>", cell_bold), Paragraph("<b>Centrality</b>", cell_bold), Paragraph("<b>Tags</b>", cell_bold)]
            ]
            for n in high_risk[:8]:
                r_score = n.get("risk_score", 0)
                r_style = badge_crit if r_score >= 80 else badge_warn
                tags = ", ".join(n.get("tags", [])) if n.get("tags") else "N/A"
                node_table_rows.append([
                    Paragraph(str(n.get("id")), cell_bold),
                    Paragraph(str(n.get("type", "Unknown")), cell_style),
                    Paragraph(f"{r_score}%", r_style),
                    Paragraph(f"{n.get('centrality', 0.0):.3f}", cell_style),
                    Paragraph(tags, cell_style)
                ])
            node_table = Table(node_table_rows, colWidths=[130, 90, 60, 80, 180])
            node_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(node_table)
        else:
            elements.append(Paragraph("No critical nodes currently flagged.", cell_style))

        elements.append(Spacer(1, 14))

        # Section: ML Isolation Forest Outliers
        elements.append(Paragraph("2. Machine Learning Anomaly Detection (Unsupervised Isolation Forest)", section_style))
        ml_anom = data.get("ml_anomaly_detection", {})
        top_ml = ml_anom.get("top_anomalies", [])
        if top_ml:
            ml_rows = [
                [Paragraph("<b>Entity ID</b>", cell_bold), Paragraph("<b>Type</b>", cell_bold), Paragraph("<b>ML Anomaly Score</b>", cell_bold), Paragraph("<b>Top Explanations / Deviations</b>", cell_bold)]
            ]
            for m in top_ml[:6]:
                score = m.get("ml_anomaly_score", 0)
                m_style = badge_crit if score >= 75 else badge_warn
                exps = "; ".join(m.get("feature_explanations", [])) or "Topological outlier across degree/entropy"
                ml_rows.append([
                    Paragraph(str(m.get("node_id")), cell_bold),
                    Paragraph(str(m.get("type")), cell_style),
                    Paragraph(f"{score}%", m_style),
                    Paragraph(exps, cell_style)
                ])
            ml_table = Table(ml_rows, colWidths=[120, 80, 90, 250])
            ml_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(ml_table)
        else:
            elements.append(Paragraph("ML model requires minimum 3 entities to evaluate topological outliers.", cell_style))

        elements.append(Spacer(1, 14))

        # Section: Recent Incident Audit Log
        elements.append(Paragraph("3. Real-Time Forensic Incident Log", section_style))
        incidents = data.get("incident_records", [])
        if incidents:
            inc_rows = [
                [Paragraph("<b>Timestamp</b>", cell_bold), Paragraph("<b>Incident Title</b>", cell_bold), Paragraph("<b>Entity</b>", cell_bold), Paragraph("<b>Severity</b>", cell_bold), Paragraph("<b>Trigger Reason</b>", cell_bold)]
            ]
            for inc in incidents[:7]:
                sev = inc.get("severity", "MEDIUM")
                s_style = badge_crit if sev == "CRITICAL" else (badge_warn if sev == "HIGH" else cell_style)
                reasons = ", ".join(inc.get("reasons", [])) if inc.get("reasons") else "Behavioral threshold exceeded"
                inc_rows.append([
                    Paragraph(str(inc.get("timestamp")), cell_style),
                    Paragraph(str(inc.get("title")), cell_bold),
                    Paragraph(str(inc.get("entity_id")), cell_style),
                    Paragraph(str(sev), s_style),
                    Paragraph(reasons, cell_style)
                ])
            inc_table = Table(inc_rows, colWidths=[80, 140, 90, 60, 170])
            inc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(inc_table)
        else:
            elements.append(Paragraph("No security incident records logged in the database yet.", cell_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
