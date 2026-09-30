from __future__ import annotations
import math
import numpy as np
from collections import Counter
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import IsolationForest
import networkx as nx
from app.engine.graph_engine import graph_engine

Tuple_Features = Tuple[List[str], np.ndarray, List[str]]

class GraphMLAnomalyDetector:
    def __init__(self, contamination: float = 0.15):
        self.contamination = contamination
        self.model: Optional[IsolationForest] = None
        self.feature_names = [
            "in_degree",
            "out_degree",
            "total_degree",
            "pagerank",
            "betweenness",
            "relationship_entropy",
            "risk_score"
        ]
        self.last_trained_nodes_count = 0

    def _compute_relationship_entropy(self, G: nx.MultiDiGraph, node: str) -> float:
        """Shannon entropy of relationship edge labels incident to node."""
        labels = []
        # In-edges
        for _, _, data in G.in_edges(node, data=True):
            labels.append(data.get("label", "connected_to"))
        # Out-edges
        for _, _, data in G.out_edges(node, data=True):
            labels.append(data.get("label", "connected_to"))

        if not labels:
            return 0.0

        counts = Counter(labels)
        total = len(labels)
        entropy = 0.0
        for count in counts.values():
            p = count / total
            entropy -= p * math.log2(p)
        return round(entropy, 3)

    def extract_features(self) -> Tuple_Features:
        G = graph_engine.graph
        nodes = list(G.nodes)
        if not nodes:
            return [], [], []

        try:
            pr = nx.pagerank(G, alpha=0.85, max_iter=50)
        except Exception:
            pr = {n: 0.1 for n in nodes}

        try:
            bw = nx.betweenness_centrality(G)
        except Exception:
            bw = {n: 0.0 for n in nodes}

        matrix = []
        node_ids = []
        for n in nodes:
            in_d = G.in_degree(n)
            out_d = G.out_degree(n)
            tot_d = in_d + out_d
            pr_val = pr.get(n, 0.0)
            bw_val = bw.get(n, 0.0)
            ent_val = self._compute_relationship_entropy(G, n)
            risk_val = float(G.nodes[n].get("risk_score", 10.0))

            row = [in_d, out_d, tot_d, pr_val, bw_val, ent_val, risk_val]
            matrix.append(row)
            node_ids.append(n)

        return node_ids, np.array(matrix, dtype=float), nodes

    def train_and_predict(self) -> Dict[str, Any]:
        node_ids, X, nodes = self.extract_features()
        if len(node_ids) < 3:
            return {
                "trained": False,
                "message": "Not enough nodes to train Isolation Forest (minimum 3 required).",
                "results": []
            }

        # Train Isolation Forest
        clf = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1
        )
        clf.fit(X)
        self.model = clf
        self.last_trained_nodes_count = len(node_ids)

        # Predictions: -1 for outlier/anomaly, 1 for inlier/normal
        predictions = clf.predict(X)
        # Decision function: lower values mean more anomalous (negative = outlier)
        scores = clf.decision_function(X)

        feature_means = np.mean(X, axis=0)
        feature_stds = np.std(X, axis=0) + 1e-6

        results = []
        for i, nid in enumerate(node_ids):
            pred = int(predictions[i])
            is_anomaly = (pred == -1)
            raw_score = float(scores[i])
            # Normalize anomaly score to 0..100 (higher = more anomalous)
            # decision_function typically ranges from -0.3 to +0.3
            norm_anomaly_score = round(max(0.0, min(100.0, (0.25 - raw_score) * 150.0)), 1)

            # Feature explanation deviations (z-scores of individual features)
            z_feats = (X[i] - feature_means) / feature_stds
            top_deviant_indices = np.argsort(np.abs(z_feats))[::-1][:3]
            explanations = []
            for idx in top_deviant_indices:
                feat_name = self.feature_names[idx]
                feat_val = round(float(X[i][idx]), 3)
                mean_val = round(float(feature_means[idx]), 3)
                z_val = round(float(z_feats[idx]), 1)
                if abs(z_val) >= 1.2:
                    explanations.append(
                        f"Unusual {feat_name.replace('_', ' ')}: {feat_val} (baseline avg: {mean_val}, deviation: {z_val:+}σ)"
                    )

            node_data = graph_engine.graph.nodes[nid]
            results.append({
                "node_id": nid,
                "label": node_data.get("label", nid),
                "type": node_data.get("type", "Device"),
                "is_ml_anomaly": is_anomaly,
                "ml_anomaly_score": norm_anomaly_score,
                "raw_decision_score": round(raw_score, 4),
                "features": {self.feature_names[j]: round(float(X[i][j]), 3) for j in range(len(self.feature_names))},
                "feature_explanations": explanations
            })

        # Sort by anomaly score descending
        results.sort(key=lambda r: r["ml_anomaly_score"], reverse=True)

        return {
            "trained": True,
            "algorithm": "Isolation Forest (Unsupervised Ensembles)",
            "total_nodes_evaluated": len(node_ids),
            "anomalies_flagged": sum(1 for r in results if r["is_ml_anomaly"]),
            "contamination_ratio": self.contamination,
            "feature_names": self.feature_names,
            "results": results
        }

ml_detector = GraphMLAnomalyDetector()
