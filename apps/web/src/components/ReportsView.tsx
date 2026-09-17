"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle,
  FolderOpen,
  Plus
} from "lucide-react";
import type { ArtifactFile } from "../lib/types";

interface ReportsViewProps {
  workspace: string | null;
  scans?: Array<{ workspace: string; state: string }>;
  onSelectWorkspace?: (ws: string) => void;
  onOpenWizard?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  workspace, 
  scans = [],
  onSelectWorkspace,
  onOpenWizard 
}) => {
  const [artifacts, setArtifacts] = useState<ArtifactFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspace) {
      setArtifacts([]);
      return;
    }
    setLoading(true);
    fetch(`/api/scans/${workspace}/artifacts`)
      .then((res) => res.json())
      .then((data) => {
        if (data.artifacts) setArtifacts(data.artifacts);
      })
      .catch((err) => console.error("Failed to fetch artifacts:", err))
      .finally(() => setLoading(false));
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">No Assessment Selected or Found</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto leading-relaxed">
            There are currently no completed or active assessments in <code className="text-emerald-400">./workspaces</code> on this host. Run an assessment to generate certified PDF reports, SARIF integrations, and structured findings.
          </p>
        </div>
        {onOpenWizard && (
          <button
            onClick={onOpenWizard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Security Assessment</span>
          </button>
        )}
      </div>
    );
  }

  const cards = [
    {
      title: "Executive Report (PDF)",
      type: "pdf",
      description: "Typst compiled formal assessment deliverable",
      badge: "PDF",
      badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      fileName: "Security-Assessment-Report.pdf",
      primary: true,
    },
    {
      title: "Security Assessment (MD)",
      type: "md",
      description: "GitHub Flavored Markdown technical summary",
      badge: "MD",
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      fileName: "Security-Assessment-Report.md",
    },
    {
      title: "SARIF 2.1.0 Log",
      type: "sarif",
      description: "GitHub CodeQL / OASIS security integration format",
      badge: "SARIF",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      fileName: "report.sarif",
    },
    {
      title: "Findings Database (JSON)",
      type: "json",
      description: "Canonical structured findings with Level 4 PoC data",
      badge: "JSON",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      fileName: "report.json",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Report & Artifact Hub
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Workspace: {workspace}
          </p>
        </div>

        {/* Workspace Selector if multiple exist */}
        {scans.length > 1 && onSelectWorkspace && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Switch Workspace:</span>
            <select
              value={workspace}
              onChange={(e) => onSelectWorkspace(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono"
            >
              {scans.map((s) => (
                <option key={s.workspace} value={s.workspace}>
                  {s.workspace} ({s.state})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const match = artifacts.find((a) => a.type === card.type);
          const isReady = match ? match.available : false;
          const sizeKb = match?.sizeBytes ? (match.sizeBytes / 1024).toFixed(1) : null;

          return (
            <div
              key={card.type}
              className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                  {isReady ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Ready {sizeKb ? `(${sizeKb} KB)` : ""}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                      <XCircle className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-zinc-100">{card.title}</h3>
                <p className="text-[11px] text-zinc-400 font-mono">{card.description}</p>
              </div>

              {isReady ? (
                <a
                  href={`/api/scans/${workspace}/artifacts?download=${card.type}`}
                  download={card.fileName}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    card.primary
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {card.badge}</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-2 px-3 rounded-lg text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed text-center"
                >
                  Generates at Scan End
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Local Filesystem Directory Notice */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold">
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          <span>Host Filesystem Artifact Path</span>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Deliverables are directly written to and read from <code className="text-emerald-300">./workspaces/{workspace}/</code> on the host machine.
        </p>
      </div>
    </div>
  );
};
