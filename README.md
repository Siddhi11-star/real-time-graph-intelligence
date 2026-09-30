# Real-Time Graph Intelligence Platform (AetherGraph) ⚡

A local-first, open-source web platform that continuously ingests streaming event data, converts complex entity relationships into a dynamic graph in near real-time, and surfaces explainable anomaly detections and topological analytics.

![AetherGraph Platform](https://img.shields.io/badge/Platform-Real--Time%20Graph%20Intelligence-f78a9c?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Cytoscape.js](https://img.shields.io/badge/Visualization-Cytoscape.js-EA580C?style=for-the-badge)

---

## 🌟 Highlights

- **Event Stream Pipeline**: Real-time event ingestion transforming relationships into a dynamic graph (`User -> logged_in_to -> Device -> connected_to -> IP -> requested -> Domain`).
- **Explainable Anomaly Detection**: Statistical $Z$-Score analysis, baseline deviation tracking, and heuristic rule triggers with transparent reasoning breakdown.
- **Topological Graph Algorithms**:
  - **Shortest Path (BFS/Dijkstra)**: Interactive path calculator highlighting hop-by-hop traversal routes.
  - **Centrality Leaderboards**: PageRank & Degree Centrality rankings with dynamic node scaling.
  - **Community Detection**: Modularity & label propagation clustering into subnet communities.
  - **Cycle Detection**: Directed feedback loop diagnostics.
- **Glassmorphic Multi-Page Experience**:
  - **Overview Hub**: System posture, threat radar, and one-click attack scenario injection.
  - **Live Graph Canvas**: Full-screen Cytoscape.js interactive workspace with retractable entity inspector.
  - **Anomaly Engine**: Filterable threat room with deep forensic diagnostics.
  - **Event Stream**: Telemetry console with raw JSON packet inspector.
  - **Graph Analytics**: Algorithmic laboratory.
- **Dual-Theme Design**:
  - **Light Mode**: Minimal soft rose pink palette with frosted white glassmorphism.
  - **Dark Mode**: Deep obsidian slate with ambient neon rose highlights.

---

## 🏗️ Architecture & Tech Stack

```text
Event Stream  ──▶  Event Processing  ──▶  Dynamic Graph Engine  ──▶  Graph Analytics  ──▶  Interactive Visualization
(WebSockets)        (In-Memory/FastAPI)      (NetworkX/State)         (Scikit-Learn/BFS)       (Cytoscape.js Canvas)
```

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & Aesthetics**| Tailwind CSS v4 + Custom Glassmorphism System |
| **Graph Visualization**| Cytoscape.js |
| **Icons & Micro-animations** | Lucide React |
| **Backend (Ready for Integration)** | Python + FastAPI + WebSockets |
| **Graph Analytics Engine** | NetworkX + scikit-learn |
| **Database** | PostgreSQL |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+) & npm

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/Siddhi11-star/real-time-graph-intelligence.git
   cd real-time-graph-intelligence
   ```

2. Install dependencies & run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open in your browser:
   ```text
   http://localhost:5173/
   ```

---

## 🛡️ Pre-Configured Threat Scenarios
Test the explainable detection engine with one click from the top navigation bar:
- ⚡ **Lateral Movement**: Workstation Charlie attempting direct SMB to Tier-0 DB bypassing bastion.
- 💥 **Credential Stuffing**: High-frequency authentication burst (140+ req/s) from bulletproof IP.
- 🛰️ **DNS Tunneling Exfiltration**: High-entropy Base64 TXT payloads beaconing to C2 domain.
- 🛡️ **Privilege Escalation**: Contractor account elevating privileges directly to Global Administrator.

---

## 📄 License
MIT License • Free & Open-Source
