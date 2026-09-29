export type EntityType = 'User' | 'Device' | 'IP' | 'Domain' | 'Process' | 'Session';

export type RelationshipType = 
  | 'logged_in_to' 
  | 'connected_to' 
  | 'requested' 
  | 'spawned' 
  | 'authenticated_as' 
  | 'accessed';

export interface GraphNodeData {
  id: string;
  label: string;
  type: EntityType;
  riskScore: number; // 0 - 100
  isAnomaly?: boolean;
  anomalyReason?: string;
  degree?: number;
  pagerank?: number;
  betweenness?: number;
  communityId?: number;
  metadata?: Record<string, string | number | boolean>;
  firstSeen?: string;
  lastSeen?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: RelationshipType;
  timestamp: string;
  weight?: number;
  isAnomaly?: boolean;
  anomalyScore?: number;
  protocol?: string;
  port?: number;
}

export interface StreamEvent {
  id: string;
  timestamp: string;
  source: string;
  sourceType: EntityType;
  relationship: RelationshipType;
  target: string;
  targetType: EntityType;
  riskScore: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  title: string;
  entityId: string;
  entityType: EntityType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number; // 0 - 100
  reasons: string[];
  metrics: {
    baselineRate?: string;
    observedRate?: string;
    zScore?: number;
    unexpectedRelation?: string;
  };
}

export interface NetworkStats {
  nodeCount: number;
  edgeCount: number;
  eventsProcessed: number;
  anomaliesDetected: number;
  eventsPerSecond: number;
  activeCommunities: number;
  highestRiskNode?: { id: string; type: EntityType; score: number };
}

export type AlgorithmMode = 'none' | 'bfs' | 'pagerank' | 'community' | 'betweenness';

export type AppPage = 'overview' | 'graph' | 'anomalies' | 'stream' | 'analytics';

export type AppTheme = 'dark' | 'light';
