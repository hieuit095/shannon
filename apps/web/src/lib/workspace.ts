import fs from 'node:fs';
import path from 'node:path';
import type { ShannonFinding, StatusJson, ArtifactFile } from './types';

// Root workspaces directory (c:\Users\USER\Documents\GitHub\shannon\workspaces)
const WORKSPACES_DIR = path.resolve(process.cwd(), '..', '..', 'workspaces');

export function getWorkspacesPath(): string {
  return WORKSPACES_DIR;
}

export function listScanWorkspaces(): string[] {
  try {
    if (!fs.existsSync(WORKSPACES_DIR)) return [];
    return fs.readdirSync(WORKSPACES_DIR).filter((dir) => {
      const full = path.join(WORKSPACES_DIR, dir);
      return fs.statSync(full).isDirectory() && !dir.startsWith('.');
    });
  } catch {
    return [];
  }
}

export function getScanFindings(workspaceName: string): ShannonFinding[] {
  try {
    const reportPath = path.join(WORKSPACES_DIR, workspaceName, '.shannon', 'report.json');
    if (fs.existsSync(reportPath)) {
      const raw = fs.readFileSync(reportPath, 'utf8');
      const data = JSON.parse(raw);
      return data.findings || data || [];
    }
  } catch (err) {
    console.error('Failed to read findings:', err);
  }
  return [];
}

export function getScanArtifacts(workspaceName: string): ArtifactFile[] {
  const ws = path.join(WORKSPACES_DIR, workspaceName);
  const internal = path.join(ws, '.shannon');

  const files: ArtifactFile[] = [
    {
      type: 'pdf',
      fileName: 'Security-Assessment-Report.pdf',
      path: path.join(ws, 'Security-Assessment-Report.pdf'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'sarif',
      fileName: 'report.sarif',
      path: path.join(internal, 'report.sarif'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'md',
      fileName: 'Security-Assessment-Report.md',
      path: path.join(ws, 'Security-Assessment-Report.md'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'json',
      fileName: 'report.json',
      path: path.join(internal, 'report.json'),
      sizeBytes: 0,
      available: false,
    },
    {
      type: 'log',
      fileName: 'workflow.log',
      path: path.join(internal, 'workflow.log'),
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
