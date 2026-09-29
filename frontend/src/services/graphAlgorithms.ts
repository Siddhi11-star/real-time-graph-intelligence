import type { GraphNodeData, GraphEdgeData } from '../types/graph';

export interface AlgorithmResults {
  degreeCentrality: Record<string, number>;
  pageRank: Record<string, number>;
  communities: Record<string, number>;
  cycles: string[][];
  connectedComponents: string[][];
}

export function computeGraphMetrics(nodes: GraphNodeData[], edges: GraphEdgeData[]): AlgorithmResults {
  const nodeMap = new Map<string, GraphNodeData>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // 1. Adjacency List
  const adj = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach(n => {
    adj.set(n.id, new Set());
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.add(e.target);
      outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // 2. Degree Centrality (normalized by N - 1)
  const n = nodes.length;
  const degreeCentrality: Record<string, number> = {};
  nodes.forEach(node => {
    const totalDeg = (inDegree.get(node.id) || 0) + (outDegree.get(node.id) || 0);
    degreeCentrality[node.id] = n > 1 ? Number((totalDeg / (n - 1)).toFixed(3)) : 0;
  });

  // 3. PageRank (Power iteration, damping = 0.85)
  const d = 0.85;
  const maxIter = 25;
  let pr: Record<string, number> = {};
  nodes.forEach(node => { pr[node.id] = 1 / (n || 1); });

  for (let it = 0; it < maxIter; it++) {
    const newPr: Record<string, number> = {};
    nodes.forEach(node => {
      newPr[node.id] = (1 - d) / (n || 1);
    });

    nodes.forEach(u => {
      const neighbors = Array.from(adj.get(u.id) || []);
      const outDeg = neighbors.length;
      if (outDeg > 0) {
        const share = (d * pr[u.id]) / outDeg;
        neighbors.forEach(v => {
          if (newPr[v] !== undefined) {
            newPr[v] += share;
          }
        });
      } else {
        // Dangling node: distribute evenly
        const share = (d * pr[u.id]) / (n || 1);
        nodes.forEach(v => {
          newPr[v.id] += share;
        });
      }
    });
    pr = newPr;
  }

  // Normalize PR to 0..1 scale for visualization
  const maxPr = Math.max(...Object.values(pr), 0.0001);
  const normalizedPr: Record<string, number> = {};
  Object.keys(pr).forEach(k => {
    normalizedPr[k] = Number((pr[k] / maxPr).toFixed(3));
  });

  // 4. Connected Components (Undirected BFS)
  const undirectedAdj = new Map<string, Set<string>>();
  nodes.forEach(node => undirectedAdj.set(node.id, new Set()));
  edges.forEach(e => {
    if (undirectedAdj.has(e.source) && undirectedAdj.has(e.target)) {
      undirectedAdj.get(e.source)!.add(e.target);
      undirectedAdj.get(e.target)!.add(e.source);
    }
  });

  const visited = new Set<string>();
  const connectedComponents: string[][] = [];

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const comp: string[] = [];
      const queue = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        undirectedAdj.get(curr)?.forEach(nbr => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }
      connectedComponents.push(comp);
    }
  });

  // 5. Community Detection (Label Propagation)
  const labels: Record<string, number> = {};
  nodes.forEach((node, i) => { labels[node.id] = i; });

  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    nodes.forEach(node => {
      const neighbors = Array.from(undirectedAdj.get(node.id) || []);
      if (neighbors.length === 0) return;

      const labelCount: Record<number, number> = {};
      neighbors.forEach(nbr => {
        const l = labels[nbr];
        labelCount[l] = (labelCount[l] || 0) + 1;
      });

      let bestLabel = labels[node.id];
      let maxCount = -1;
      Object.entries(labelCount).forEach(([lblStr, count]) => {
        const lbl = Number(lblStr);
        if (count > maxCount) {
          maxCount = count;
          bestLabel = lbl;
        }
      });

      if (labels[node.id] !== bestLabel) {
        labels[node.id] = bestLabel;
        changed = true;
      }
    });
    if (!changed) break;
  }

  // Remap labels to 0..K-1
  const uniqueLabels = Array.from(new Set(Object.values(labels)));
  const labelMap = new Map<number, number>();
  uniqueLabels.forEach((l, idx) => labelMap.set(l, idx + 1));
  const communities: Record<string, number> = {};
  nodes.forEach(node => {
    communities[node.id] = labelMap.get(labels[node.id]) || 1;
  });

  // 6. Directed Cycle Detection (DFS)
  const cycles: string[][] = [];
  const state = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  nodes.forEach(node => state.set(node.id, 0));
  const path: string[] = [];

  function dfsCycle(u: string) {
    state.set(u, 1);
    path.push(u);

    const neighbors = Array.from(adj.get(u) || []);
    for (const v of neighbors) {
      if (state.get(v) === 1) {
        // Cycle detected: extract cycle slice
        const cycleStartIndex = path.indexOf(v);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex).concat(v));
        }
      } else if (state.get(v) === 0) {
        dfsCycle(v);
      }
    }

    path.pop();
    state.set(u, 2);
  }

  nodes.forEach(node => {
    if (state.get(node.id) === 0) {
      dfsCycle(node.id);
    }
  });

  return {
    degreeCentrality,
    pageRank: normalizedPr,
    communities,
    cycles,
    connectedComponents,
  };
}

export function findShortestPath(
  startId: string, 
  targetId: string, 
  nodes: GraphNodeData[], 
  edges: GraphEdgeData[]
): { path: string[]; edgeIds: string[]; distance: number } | null {
  if (startId === targetId) return { path: [startId], edgeIds: [], distance: 0 };

  const adj = new Map<string, { to: string; edgeId: string }[]>();
  nodes.forEach(n => adj.set(n.id, []));

  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push({ to: e.target, edgeId: e.id });
      // Also consider undirected traversal for cybersecurity investigation
      adj.get(e.target)!.push({ to: e.source, edgeId: e.id });
    }
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const parent = new Map<string, { prev: string; edgeId: string }>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetId) break;

    const neighbors = adj.get(curr) || [];
    for (const { to, edgeId } of neighbors) {
      if (!visited.has(to)) {
        visited.add(to);
        parent.set(to, { prev: curr, edgeId });
        queue.push(to);
      }
    }
  }

  if (!parent.has(targetId)) return null;

  const path: string[] = [];
  const edgeIds: string[] = [];
  let curr = targetId;
  while (curr !== startId) {
    path.unshift(curr);
    const link = parent.get(curr)!;
    edgeIds.unshift(link.edgeId);
    curr = link.prev;
  }
  path.unshift(startId);

  return {
    path,
    edgeIds,
    distance: edgeIds.length
  };
}
