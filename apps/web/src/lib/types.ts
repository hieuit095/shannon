export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'exploited' | 'blocked' | 'false_positive' | 'out_of_scope';
export type ScanStatus = 'running' | 'completed' | 'partial' | 'failed' | 'stopped' | 'cancelled' | 'timed_out' | 'pending';

export interface SystemHealth {
  docker: {
    running: boolean;
    error?: string;
  };
  temporal: {
    running: boolean;
    error?: string;
  };
  credentials: {
    configured: boolean;
    providerHint?: string;
  };
  workspacesDir: string;
  workspaceCount: number;
}

export interface CodeLocation {
  file: string;
  start_line?: number | null;
  end_line?: number | null;
  role: 'sink' | 'source' | 'guard';
  symbol?: string | null;
}

export interface HttpLocation {
  method: string;
  url: string;
  parameter?: string | null;
}

export interface StepItem {
  kind: 'prose' | 'code';
  text?: string;
  block?: {
    language: string;
    content: string;
  };
}

export interface StructuredStep {
  title?: string | null;
  items: StepItem[];
}

export interface ShannonFinding {
  finding_id: string;
  title: string;
  category: 'Injection' | 'XSS' | 'Authentication' | 'SSRF' | 'Authorization' | 'Miscellaneous';
  owasp_category: string;
  severity: Severity;
  severity_rationale?: string | null;
  confidence?: 'high' | 'medium' | 'low';
  status: FindingStatus;
  vulnerable_location: string;
  http_location?: HttpLocation | null;
  code_locations?: CodeLocation[];
  overview: string;
  impact: string;
  remediation: string;
  auth_state?: string | null;
  prerequisites?: string | null;
  exploitation_steps: StructuredStep[];
  proof_of_impact: StepItem[];
}

export interface DerivedAgent {
  name: string;
  label: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs: number | null;
  runningElapsedMs: number | null;
  attempt: number | null;
  detail?: string;
  error?: string;
}

export interface DerivedPhase {
  key: string;
  label: string;
  children: boolean;
  meta: 'duration' | 'count';
  state: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  summary?: DerivedAgent;
  note?: string;
  agents: DerivedAgent[];
}

export interface StatusJson {
  workspace: string;
  workflowId?: string;
  status: ScanStatus;
  temporalStatus: string;
  elapsedMs: number | null;
  startedAt?: string;
  endedAt?: string;
  failureMessage?: string;
  phases: DerivedPhase[];
  costUsd?: number;
  totalTurns?: number;
}

export interface TargetConfig {
  id: string;
  name: string;
  url: string;
  repoPath?: string;
  repoUrl?: string;
  loginType: 'form' | 'sso' | 'api' | 'basic' | 'none';
  loginUrl?: string;
  username?: string;
  password?: string;
  totpSecret?: string;
  successConditionType?: string;
  successConditionValue?: string;
  rulesAvoid: string[];
  rulesFocus: string[];
  agenticSast: boolean;
  exploitMode: boolean;
  modelSpec: string;
  customBaseUrl?: string;
}

export interface ArtifactFile {
  type: 'pdf' | 'sarif' | 'md' | 'json' | 'log';
  fileName: string;
  sizeBytes: number;
  available: boolean;
  path: string;
}
