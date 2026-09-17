import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { ShannonFinding, StatusJson, ArtifactFile, SystemHealth } from './types';

// Root directory of the Shannon monorepo
const REPO_ROOT = path.resolve(process.cwd(), '..', '..');
const WORKSPACES_DIR = path.join(REPO_ROOT, 'workspaces');

function getCliPath(): string {
  const filename = ['index', 'mjs'].join('.');
  return path.resolve(REPO_ROOT, 'apps', 'cli', 'dist', filename);
}

export type { SystemHealth };


/** Check health of host infrastructure (Docker, Temporal, Credentials) */
export function getSystemHealth(): SystemHealth {
  let dockerRunning = false;
  let dockerError: string | undefined;

  try {
    execFileSync('docker', ['info'], { stdio: 'pipe', timeout: 3000 });
    dockerRunning = true;
  } catch (err: any) {
    dockerRunning = false;
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('cannot find the file specified') || stderr.includes('pipe')) {
      dockerError = 'Docker Desktop is not running or socket is closed';
    } else {
      dockerError = stderr.trim() || err.message || 'Docker daemon is unavailable';
    }
  }

  let temporalRunning = false;
  let temporalError: string | undefined;

  if (dockerRunning) {
    try {
      const output = execFileSync('docker', ['ps', '--filter', 'name=shannon-temporal', '--format', '{{.Names}}'], {
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 3000,
      }).trim();
      if (output.includes('shannon-temporal')) {
        temporalRunning = true;
      } else {
        temporalError = 'Container shannon-temporal is stopped';
      }
    } catch (err: any) {
      temporalError = err.message;
    }
  } else {
    temporalError = 'Docker is offline (Temporal container inactive)';
  }

  // Check if any AI provider credentials are in process.env or .env
  const credsConfigured = !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.SHANNON_AI_API_KEY ||
    process.env.AWS_BEARER_TOKEN_BEDROCK
  );

  let count = 0;
  try {
    if (fs.existsSync(WORKSPACES_DIR)) {
      count = fs.readdirSync(WORKSPACES_DIR).filter((d) => !d.startsWith('.')).length;
    }
  } catch {}

  return {
    docker: { running: dockerRunning, error: dockerError },
    temporal: { running: temporalRunning, error: temporalError },
    credentials: {
      configured: credsConfigured,
      providerHint: credsConfigured ? 'Active' : 'No AI API keys detected in environment',
    },
    workspacesDir: WORKSPACES_DIR,
    workspaceCount: count,
  };
}

export interface ScanLaunchParams {
  url: string;
  repoPath: string;
  workspaceName?: string;
  configYaml?: string;
  modelSpec?: string;
  apiKey?: string;
  customBaseUrl?: string;
  agenticSast?: boolean;
  exploitMode?: boolean;
}

/** List all real scans from Shannon CLI and disk */
export function listScans(): Array<{
  workspace: string;
  state: 'running' | 'completed' | 'failed';
  finishedAt: string | null;
  durationMs: number | null;
  reportPath: string | null;
}> {
  const scansMap = new Map<string, any>();

  // 1. Try CLI scans --json first
  try {
    const cliPath = getCliPath();
    if (fs.existsSync(cliPath)) {
      const output = execFileSync(process.execPath, [cliPath, 'scans', '--json'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000,
      }).trim();
      const parsed = JSON.parse(output || '[]');
      for (const row of parsed) {
        scansMap.set(row.workspace, row);
      }
    }
  } catch {}

  // 2. Read WORKSPACES_DIR directly on disk for complete accuracy
  try {
    if (fs.existsSync(WORKSPACES_DIR)) {
      const dirs = fs.readdirSync(WORKSPACES_DIR).filter((name) => {
        if (name.startsWith('.') || name === 'node_modules') return false;
        try {
          return fs.statSync(path.join(WORKSPACES_DIR, name)).isDirectory();
        } catch {
          return false;
        }
      });

      for (const dir of dirs) {
        if (!scansMap.has(dir)) {
          const runDir = path.join(WORKSPACES_DIR, dir);
          const pdfPath = path.join(runDir, 'Security-Assessment-Report.pdf');
          const mdPath = path.join(runDir, 'Security-Assessment-Report.md');
          const sessionPath = path.join(runDir, '.shannon', 'session.json');

          let finishedAt: string | null = null;
          let durationMs: number | null = null;
          let isCompleted = false;

          if (fs.existsSync(pdfPath)) {
            finishedAt = fs.statSync(pdfPath).mtime.toISOString();
            isCompleted = true;
          } else if (fs.existsSync(mdPath)) {
            finishedAt = fs.statSync(mdPath).mtime.toISOString();
            isCompleted = true;
          }

          if (fs.existsSync(sessionPath)) {
            try {
              const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
              if (session.session?.completedAt) finishedAt = session.session.completedAt;
              if (session.session?.createdAt && finishedAt) {
                durationMs = new Date(finishedAt).getTime() - new Date(session.session.createdAt).getTime();
              }
            } catch {}
          }

          scansMap.set(dir, {
            workspace: dir,
            state: isCompleted ? 'completed' : 'failed',
            finishedAt,
            durationMs,
            reportPath: isCompleted ? (fs.existsSync(pdfPath) ? pdfPath : mdPath) : null,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error reading workspaces dir:', err);
  }

  return Array.from(scansMap.values());
}

/** Get status of a specific scan from Shannon CLI or disk */
export function getScanStatus(workspace: string): StatusJson | null {
  // 1. Try Temporal / CLI status query
  try {
    const cliPath = getCliPath();
    if (fs.existsSync(cliPath)) {
      const output = execFileSync(process.execPath, [cliPath, 'status', workspace, '--json'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000,
      }).trim();
      return JSON.parse(output);
    }
  } catch {}

  // 2. Fallback: Parse durable state directly from .shannon/session.json
  try {
    const sessionPath = path.join(WORKSPACES_DIR, workspace, '.shannon', 'session.json');
    if (fs.existsSync(sessionPath)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      const durable = sessionData.durableScanState;
      const isCompleted = fs.existsSync(path.join(WORKSPACES_DIR, workspace, 'Security-Assessment-Report.pdf')) ||
                          fs.existsSync(path.join(WORKSPACES_DIR, workspace, 'Security-Assessment-Report.md'));

      return {
        workspace,
        workflowId: sessionData.session?.originalWorkflowId || workspace,
        status: isCompleted ? 'completed' : 'failed',
        temporalStatus: isCompleted ? 'COMPLETED' : 'FAILED',
        elapsedMs: null,
        startedAt: sessionData.session?.createdAt,
        endedAt: sessionData.session?.completedAt,
        phases: [],
      };
    }
  } catch {}

  return null;
}

/** Read real findings from .shannon/report.json */
export function getRealFindings(workspace: string): ShannonFinding[] {
  try {
    const reportPath = path.join(WORKSPACES_DIR, workspace, '.shannon', 'report.json');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf8');
      const data = JSON.parse(content);
      return data.findings || (Array.isArray(data) ? data : []);
    }
  } catch (err) {
    console.error(`Failed to read findings for ${workspace}:`, err);
  }
  return [];
}

/** Check and return real artifact files on disk */
export function getRealArtifacts(workspace: string): ArtifactFile[] {
  const wsDir = path.join(WORKSPACES_DIR, workspace);
  const internalDir = path.join(wsDir, '.shannon');

  const files: ArtifactFile[] = [
    {
      type: 'pdf',
      fileName: 'Security-Assessment-Report.pdf',
      path: path.join(wsDir, 'Security-Assessment-Report.pdf'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'sarif',
      fileName: 'report.sarif',
      path: path.join(internalDir, 'report.sarif'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'md',
      fileName: 'Security-Assessment-Report.md',
      path: path.join(wsDir, 'Security-Assessment-Report.md'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'json',
      fileName: 'report.json',
      path: path.join(internalDir, 'report.json'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'log',
      fileName: 'workflow.log',
      path: path.join(internalDir, 'workflow.log'),
      sizeBytes: 0,
      available: false,
    },
  ];

  return files.map((f) => {
    try {
      if (fs.existsSync(f.path)) {
        const stat = fs.statSync(f.path);
        return { ...f, sizeBytes: stat.size, available: true };
      }
    } catch {}
    return f;
  });
}

/** Stop a running scan via Shannon CLI */
export function stopScan(workspace: string): boolean {
  try {
    const cliPath = getCliPath();
    execFileSync(process.execPath, [cliPath, 'stop', workspace, '--yes'], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      timeout: 10000,
    });
    return true;
  } catch (err) {
    console.error(`Failed to stop scan ${workspace}:`, err);
    return false;
  }
}

/** Launch a real Shannon pentest scan */
export function launchScan(params: ScanLaunchParams): { success: boolean; workspace: string; message?: string; error?: string } {
  // Check health first to provide clear actionable error if Docker is down
  const health = getSystemHealth();
  if (!health.docker.running) {
    return {
      success: false,
      workspace: params.workspaceName || 'unknown',
      error: `Docker is not running on host machine: ${health.docker.error}. Please start Docker Desktop before launching a pentest.`,
    };
  }

  const workspace = params.workspaceName || 
    `${new URL(params.url).hostname.replace(/[^a-zA-Z0-9-]/g, '-')}_shannon-${Date.now()}`;
  
  const cliPath = getCliPath();
  const args = [
    cliPath,
    'start',
    '-u', params.url,
    '-r', params.repoPath,
    '-w', workspace,
  ];

  // If configuration YAML is provided, write it to a temporary location
  let configPath: string | undefined;
  if (params.configYaml && params.configYaml.trim().length > 0) {
    const tmpDir = path.join(WORKSPACES_DIR, '.tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    configPath = path.join(tmpDir, `config-${workspace}.yaml`);
    fs.writeFileSync(configPath, params.configYaml, 'utf8');
    args.push('-c', configPath);
  }

  const env = { ...process.env };
  if (params.modelSpec) {
    env.SHANNON_AI_MODEL = params.modelSpec;
  }
  if (params.apiKey) {
    env.SHANNON_AI_API_KEY = params.apiKey;
  }
  if (params.customBaseUrl) {
    env.SHANNON_AI_BASE_URL = params.customBaseUrl;
  }

  try {
    // Spawn CLI detached in background
    const child = spawn(process.execPath, args, {
      cwd: REPO_ROOT,
      detached: true,
      stdio: 'ignore',
      env,
    });
    child.unref();

    return {
      success: true,
      workspace,
      message: `Scan spawned successfully for ${params.url} (Workspace: ${workspace})`,
    };
  } catch (err: any) {
    return {
      success: false,
      workspace,
      error: err.message || 'Failed to spawn Shannon CLI process',
    };
  }
}

/** Serialize scan configuration into Shannon config.yaml format */
export function buildConfigYaml(params: {
  loginType?: string;
  loginUrl?: string;
  username?: string;
  password?: string;
  totpSecret?: string;
  successConditionType?: string;
  successConditionValue?: string;
  rulesAvoid?: string[];
  rulesFocus?: string[];
  agenticSast?: boolean;
  exploitMode?: boolean;
}): string {
  const lines: string[] = [];

  if (params.loginType && params.loginType !== 'none') {
    lines.push('authentication:');
    lines.push(`  login_type: "${params.loginType}"`);
    if (params.loginUrl) lines.push(`  login_url: "${params.loginUrl}"`);
    lines.push('  credentials:');
    if (params.username) lines.push(`    username: "${params.username}"`);
    if (params.password) lines.push(`    password: "${params.password}"`);
    if (params.totpSecret) lines.push(`    totp_secret: "${params.totpSecret}"`);
    if (params.successConditionValue) {
      lines.push('  success_condition:');
      lines.push(`    type: "${params.successConditionType || 'url_contains'}"`);
      lines.push(`    value: "${params.successConditionValue}"`);
    }
  }

  const hasRules = (params.rulesAvoid && params.rulesAvoid.length > 0) || 
                   (params.rulesFocus && params.rulesFocus.length > 0);
  if (hasRules) {
    lines.push('rules:');
    if (params.rulesAvoid && params.rulesAvoid.length > 0) {
      lines.push('  avoid:');
      for (const r of params.rulesAvoid) {
        lines.push('    - type: "url_path"');
        lines.push(`      value: "${r}"`);
      }
    }
    if (params.rulesFocus && params.rulesFocus.length > 0) {
      lines.push('  focus:');
      for (const r of params.rulesFocus) {
        lines.push('    - type: "url_path"');
        lines.push(`      value: "${r}"`);
      }
    }
  }

  if (params.agenticSast !== undefined) {
    lines.push('agentic_sast:');
    lines.push(`  enabled: "${params.agenticSast ? 'true' : 'false'}"`);
  }

  if (params.exploitMode !== undefined) {
    lines.push(`exploit: "${params.exploitMode ? 'true' : 'false'}"`);
  }

  return lines.join('\n');
}
