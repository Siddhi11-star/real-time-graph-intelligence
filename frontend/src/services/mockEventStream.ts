import type { StreamEvent, EntityType, RelationshipType, AnomalyAlert } from '../types/graph';

// Initial baseline topology entities
export const INITIAL_ENTITIES: { id: string; label: string; type: EntityType; riskScore: number; metadata?: Record<string, string | number> }[] = [
  // Users
  { id: 'usr-admin', label: 'admin_sys', type: 'User', riskScore: 15, metadata: { department: 'IT-Security', role: 'GlobalAdmin' } },
  { id: 'usr-alice', label: 'alice_sec', type: 'User', riskScore: 10, metadata: { department: 'SOC-Team', role: 'Analyst' } },
  { id: 'usr-bob', label: 'bob_dev', type: 'User', riskScore: 20, metadata: { department: 'Engineering', role: 'DevOps' } },
  { id: 'usr-charlie', label: 'charlie_sales', type: 'User', riskScore: 35, metadata: { department: 'Sales', role: 'Executive' } },
  { id: 'usr-guest', label: 'guest_contractor', type: 'User', riskScore: 55, metadata: { department: 'Vendor', role: 'Contractor' } },

  // Devices
  { id: 'dev-dc01', label: 'DC-PRIMARY-01', type: 'Device', riskScore: 12, metadata: { os: 'Windows Server 2022', subnet: '10.0.1.0/24' } },
  { id: 'dev-db01', label: 'PROD-DB-CLUSTER', type: 'Device', riskScore: 15, metadata: { os: 'Ubuntu 24.04', subnet: '10.0.2.0/24' } },
  { id: 'dev-ws-alice', label: 'WS-ALICE-M3', type: 'Device', riskScore: 8, metadata: { os: 'macOS 15', subnet: '10.0.5.0/24' } },
  { id: 'dev-ws-charlie', label: 'WS-CHARLIE-PC', type: 'Device', riskScore: 65, metadata: { os: 'Windows 11', subnet: '10.0.5.0/24' } },
  { id: 'dev-gw01', label: 'BORDER-GW-01', type: 'Device', riskScore: 25, metadata: { os: 'FortiOS', subnet: '172.16.0.0/16' } },

  // IPs
  { id: 'ip-internal-gw', label: '10.0.0.1', type: 'IP', riskScore: 5, metadata: { zone: 'Internal-Gateway' } },
  { id: 'ip-cloud-auth', label: '52.96.165.2', type: 'IP', riskScore: 8, metadata: { provider: 'Microsoft Azure' } },
  { id: 'ip-threat-actor', label: '194.26.29.112', type: 'IP', riskScore: 92, metadata: { country: 'RU', asn: 'AS44050' } },
  { id: 'ip-public-dns', label: '1.1.1.1', type: 'IP', riskScore: 5, metadata: { provider: 'Cloudflare' } },

  // Domains
  { id: 'dom-internal', label: 'corp.internal.net', type: 'Domain', riskScore: 5, metadata: { registrar: 'Internal' } },
  { id: 'dom-github', label: 'api.github.com', type: 'Domain', riskScore: 10, metadata: { category: 'Developer Tools' } },
  { id: 'dom-c2-dark', label: 'sync-telemetry-cdn.xyz', type: 'Domain', riskScore: 96, metadata: { category: 'Malicious C2' } },

  // Processes
  { id: 'proc-svchost', label: 'svchost.exe (pid:1042)', type: 'Process', riskScore: 5, metadata: { path: 'C:\\Windows\\System32' } },
  { id: 'proc-powershell', label: 'powershell.exe (pid:4901)', type: 'Process', riskScore: 82, metadata: { path: 'C:\\Windows\\System32\\WindowsPowerShell' } },
  { id: 'proc-ssh', label: 'sshd: worker-node (pid:812)', type: 'Process', riskScore: 12, metadata: { path: '/usr/sbin/sshd' } },

  // Sessions
  { id: 'sess-vpn-01', label: 'VPN-TNL-9921', type: 'Session', riskScore: 18, metadata: { cipher: 'AES-256-GCM', duration: '4h 12m' } },
  { id: 'sess-ssh-88', label: 'SSH-PROD-ADM', type: 'Session', riskScore: 30, metadata: { auth: 'ed25519-key' } },
];

export const INITIAL_EDGES: { id: string; source: string; target: string; label: RelationshipType; riskScore: number; timestamp: string }[] = [
  { id: 'e1', source: 'usr-admin', target: 'dev-dc01', label: 'logged_in_to', riskScore: 10, timestamp: '18:20:00' },
  { id: 'e2', source: 'usr-alice', target: 'dev-ws-alice', label: 'logged_in_to', riskScore: 5, timestamp: '18:21:15' },
  { id: 'e3', source: 'usr-charlie', target: 'dev-ws-charlie', label: 'logged_in_to', riskScore: 40, timestamp: '18:22:10' },
  { id: 'e4', source: 'dev-ws-alice', target: 'ip-internal-gw', label: 'connected_to', riskScore: 5, timestamp: '18:22:45' },
  { id: 'e5', source: 'dev-ws-charlie', target: 'dev-gw01', label: 'connected_to', riskScore: 25, timestamp: '18:23:00' },
  { id: 'e6', source: 'dev-dc01', target: 'dev-db01', label: 'connected_to', riskScore: 12, timestamp: '18:23:30' },
  { id: 'e7', source: 'dev-gw01', target: 'ip-cloud-auth', label: 'connected_to', riskScore: 8, timestamp: '18:24:00' },
  { id: 'e8', source: 'ip-internal-gw', target: 'dom-internal', label: 'requested', riskScore: 5, timestamp: '18:24:20' },
  { id: 'e9', source: 'dev-ws-alice', target: 'proc-svchost', label: 'spawned', riskScore: 5, timestamp: '18:24:40' },
  { id: 'e10', source: 'dev-db01', target: 'proc-ssh', label: 'spawned', riskScore: 10, timestamp: '18:25:00' },
  { id: 'e11', source: 'usr-admin', target: 'sess-vpn-01', label: 'accessed', riskScore: 10, timestamp: '18:25:10' },
];

export class MockEventStreamService {
  private intervalId: number | null = null;
  private isRunning: boolean = true;
  private speedMs: number = 2000;
  private onEventCallback: ((event: StreamEvent, anomaly?: AnomalyAlert) => void) | null = null;
  private eventCounter: number = INITIAL_EDGES.length;

  constructor() {}

  public subscribe(callback: (event: StreamEvent, anomaly?: AnomalyAlert) => void) {
    this.onEventCallback = callback;
    this.start();
  }

  public setSpeed(speedMs: number) {
    this.speedMs = speedMs;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public pause() {
    this.isRunning = false;
    this.stop();
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.start();
    }
  }

  public getIsRunning() {
    return this.isRunning;
  }

  private start() {
    if (this.intervalId !== null) return;
    this.intervalId = window.setInterval(() => {
      this.generateNormalEvent();
    }, this.speedMs);
  }

  private stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private getFormattedTime(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  public triggerScenario(scenarioType: 'lateral_movement' | 'credential_stuffing' | 'dns_exfil' | 'privilege_escalation') {
    switch (scenarioType) {
      case 'lateral_movement':
        this.injectLateralMovement();
        break;
      case 'credential_stuffing':
        this.injectCredentialStuffing();
        break;
      case 'dns_exfil':
        this.injectDnsExfil();
        break;
      case 'privilege_escalation':
        this.injectPrivilegeEscalation();
        break;
    }
  }

  private generateNormalEvent() {
    if (!this.onEventCallback) return;
    this.eventCounter++;

    const normalPairs: { s: string; st: EntityType; r: RelationshipType; t: string; tt: EntityType; desc: string }[] = [
      { s: 'usr-bob', st: 'User', r: 'logged_in_to', t: 'dev-ws-alice', tt: 'Device', desc: 'Dev remote desktop pair' },
      { s: 'dev-ws-alice', st: 'Device', r: 'connected_to', t: 'ip-public-dns', tt: 'IP', desc: 'DNS lookup 1.1.1.1' },
      { s: 'ip-internal-gw', st: 'IP', r: 'requested', t: 'dom-github', tt: 'Domain', desc: 'GitHub API sync' },
      { s: 'dev-dc01', st: 'Device', r: 'spawned', t: 'proc-svchost', tt: 'Process', desc: 'Routine service maintenance' },
      { s: 'usr-admin', st: 'User', r: 'accessed', t: 'sess-ssh-88', tt: 'Session', desc: 'SSH maintenance session' },
      { s: 'dev-db01', st: 'Device', r: 'connected_to', t: 'ip-internal-gw', tt: 'IP', desc: 'Database heartbeat sync' },
      { s: 'usr-alice', st: 'User', r: 'accessed', t: 'sess-vpn-01', tt: 'Session', desc: 'VPN keepalive' },
    ];

    const pick = normalPairs[Math.floor(Math.random() * normalPairs.length)];
    const time = this.getFormattedTime();

    const event: StreamEvent = {
      id: `evt-${this.eventCounter}`,
      timestamp: time,
      source: pick.s,
      sourceType: pick.st,
      relationship: pick.r,
      target: pick.t,
      targetType: pick.tt,
      riskScore: Math.floor(Math.random() * 20) + 5,
      isAnomaly: false,
      metadata: { note: pick.desc },
    };

    this.onEventCallback(event);
  }

  private injectLateralMovement() {
    if (!this.onEventCallback) return;
    this.eventCounter++;
    const time = this.getFormattedTime();

    // Step 1: Workstation Charlie connects directly to critical DB cluster without VPN/bastion
    const evt1: StreamEvent = {
      id: `evt-${this.eventCounter}-lat1`,
      timestamp: time,
      source: 'dev-ws-charlie',
      sourceType: 'Device',
      relationship: 'connected_to',
      target: 'dev-db01',
      targetType: 'Device',
      riskScore: 89,
      isAnomaly: true,
      anomalyReason: 'Unprecedented lateral pivot: Sales workstation attempting direct SMB/RDP to PROD-DB-CLUSTER bypassing security gateway.',
      metadata: { port: 445, protocol: 'SMBv2', segmentViolation: true },
    };

    const alert1: AnomalyAlert = {
      id: `alt-${Date.now()}-lat1`,
      timestamp: time,
      title: 'Lateral Movement Detected',
      entityId: 'dev-ws-charlie',
      entityType: 'Device',
      severity: 'critical',
      score: 89,
      reasons: [
        'Sudden cross-subnet connection to Tier-0 database asset',
        'Sales department host never observed connecting to DB-CLUSTER in 90-day baseline',
        'Graph Shortest-Path violation: Bypassed bastion jump host'
      ],
      metrics: {
        baselineRate: '0.00 / day',
        observedRate: '1.00 / min',
        zScore: 4.8,
        unexpectedRelation: 'WS-CHARLIE-PC -> PROD-DB-CLUSTER'
      }
    };

    this.onEventCallback(evt1, alert1);

    // Step 2: Spawn powershell on DB cluster
    setTimeout(() => {
      this.eventCounter++;
      const time2 = this.getFormattedTime();
      const evt2: StreamEvent = {
        id: `evt-${this.eventCounter}-lat2`,
        timestamp: time2,
        source: 'dev-db01',
        sourceType: 'Device',
        relationship: 'spawned',
        target: 'proc-powershell',
        targetType: 'Process',
        riskScore: 94,
        isAnomaly: true,
        anomalyReason: 'Suspicious child process spawned on production database server following lateral connection.',
        metadata: { cmdline: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc ...' },
      };

      const alert2: AnomalyAlert = {
        id: `alt-${Date.now()}-lat2`,
        timestamp: time2,
        title: 'Exploit Execution / Suspicious Process Spawn',
        entityId: 'proc-powershell',
        entityType: 'Process',
        severity: 'critical',
        score: 94,
        reasons: [
          'High-entropy encoded execution arguments (-Enc)',
          'Linux server attempting Windows-style emulation or PowerShell core injection',
          'Immediate correlation with prior anomalous lateral connection'
        ],
        metrics: {
          zScore: 5.6,
          observedRate: 'High Risk'
        }
      };

      this.onEventCallback && this.onEventCallback(evt2, alert2);
    }, 800);
  }

  private injectCredentialStuffing() {
    if (!this.onEventCallback) return;
    this.eventCounter++;
    const time = this.getFormattedTime();

    const evt: StreamEvent = {
      id: `evt-${this.eventCounter}-burst`,
      timestamp: time,
      source: 'ip-threat-actor',
      sourceType: 'IP',
      relationship: 'connected_to',
      target: 'dev-gw01',
      targetType: 'Device',
      riskScore: 92,
      isAnomaly: true,
      anomalyReason: 'High-frequency credential stuffing burst from known malicious bulletproof IP range.',
      metadata: { attemptsPerSec: 142, userAgent: 'Python-urllib/3.10', threatFeed: 'AbuseIPDB 100%' },
    };

    const alert: AnomalyAlert = {
      id: `alt-${Date.now()}-stuffing`,
      timestamp: time,
      title: 'Credential Stuffing & Burst Activity',
      entityId: 'ip-threat-actor',
      entityType: 'IP',
      severity: 'critical',
      score: 92,
      reasons: [
        'Spike in connection frequency: 142 req/s (Baseline: 0.1 req/s)',
        'Originating from high-risk ASN (AS44050) flagged for active brute force',
        'Multiple user authentication targets cycled in rapid succession'
      ],
      metrics: {
        baselineRate: '0.12 req/s',
        observedRate: '142 req/s',
        zScore: 6.9,
        unexpectedRelation: '194.26.29.112 -> BORDER-GW-01'
      }
    };

    this.onEventCallback(evt, alert);
  }

  private injectDnsExfil() {
    if (!this.onEventCallback) return;
    this.eventCounter++;
    const time = this.getFormattedTime();

    const evt: StreamEvent = {
      id: `evt-${this.eventCounter}-exfil`,
      timestamp: time,
      source: 'dev-ws-charlie',
      sourceType: 'Device',
      relationship: 'requested',
      target: 'dom-c2-dark',
      targetType: 'Domain',
      riskScore: 98,
      isAnomaly: true,
      anomalyReason: 'High entropy DNS TXT query burst indicating C2 beaconing and structured data exfiltration.',
      metadata: { payloadSize: '4.8 MB', entropy: 4.92, recordType: 'TXT' },
    };

    const alert: AnomalyAlert = {
      id: `alt-${Date.now()}-exfil`,
      timestamp: time,
      title: 'Data Exfiltration / C2 Beaconing',
      entityId: 'dom-c2-dark',
      entityType: 'Domain',
      severity: 'critical',
      score: 98,
      reasons: [
        'Connection established with unclassified dynamic DNS domain',
        'High Shannon entropy DNS query labels indicating Base64 payload tunneling',
        'Continuous periodic beaconing signature (every 30s jittered)'
      ],
      metrics: {
        baselineRate: '0 req/s',
        observedRate: '48 req/min',
        zScore: 5.1,
        unexpectedRelation: 'WS-CHARLIE-PC -> sync-telemetry-cdn.xyz'
      }
    };

    this.onEventCallback(evt, alert);
  }

  private injectPrivilegeEscalation() {
    if (!this.onEventCallback) return;
    this.eventCounter++;
    const time = this.getFormattedTime();

    const evt: StreamEvent = {
      id: `evt-${this.eventCounter}-priv`,
      timestamp: time,
      source: 'usr-guest',
      sourceType: 'User',
      relationship: 'authenticated_as',
      target: 'usr-admin',
      targetType: 'User',
      riskScore: 88,
      isAnomaly: true,
      anomalyReason: 'Contractor account performed unauthorized Token Impersonation / SeDebugPrivilege elevation.',
      metadata: { technique: 'T1134 Access Token Manipulation', logCode: '4624/4672' },
    };

    const alert: AnomalyAlert = {
      id: `alt-${Date.now()}-priv`,
      timestamp: time,
      title: 'Privilege Escalation Alert',
      entityId: 'usr-guest',
      entityType: 'User',
      severity: 'high',
      score: 88,
      reasons: [
        'Contractor guest account elevated privileges directly to Global Administrator',
        'Suspicious Kerberos TGS ticket requested with unusual encryption downgrade (RC4-HMAC)',
        'Violation of least-privilege policy'
      ],
      metrics: {
        baselineRate: '0',
        observedRate: '1',
        zScore: 4.4,
        unexpectedRelation: 'guest_contractor -> admin_sys'
      }
    };

    this.onEventCallback(evt, alert);
  }
}

export const mockStreamService = new MockEventStreamService();
