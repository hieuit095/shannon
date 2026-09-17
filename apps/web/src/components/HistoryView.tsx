"use client";

import React from "react";
import { 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Plus,
  FileText
} from "lucide-react";

interface HistoryScanItem {
  workspace: string;
  state: "running" | "completed" | "failed";
  finishedAt: string | null;
  durationMs: number | null;
  reportPath: string | null;
}

interface HistoryViewProps {
  scans: HistoryScanItem[];
  activeScanId: string | null;
  onSelectScan: (workspace: string) => void;
  onOpenWizard: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  scans,
  activeScanId,
  onSelectScan,
  onOpenWizard,
}) => {
  const formatDuration = (ms: number | null) => {
    if (!ms) return "--";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "In Progress / Not recorded";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  if (scans.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">No Assessment Workspaces Recorded</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto leading-relaxed">
            No assessment runs have been recorded in <code className="text-emerald-400">./workspaces</code> on this host yet. When Shannon executes a pentest, each workspace directory and its audit trail are preserved here.
          </p>
        </div>
        <button
          onClick={onOpenWizard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Configure & Launch Assessment</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Host Assessment Sessions ({scans.length})
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Recorded workspaces from ./workspaces on local host
          </p>
        </div>

        <button
          onClick={onOpenWizard}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Assessment</span>
        </button>
      </div>

      {/* Real Scans Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 text-xs font-mono font-bold text-zinc-300">
          Host Workspace Audit Log
        </div>
        <div className="divide-y divide-zinc-800/80 font-mono text-xs">
          {scans.map((s) => {
            const isCurrent = s.workspace === activeScanId;
            return (
              <div
                key={s.workspace}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-zinc-800/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{s.workspace}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Finished: {formatDate(s.finishedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-zinc-400 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">DURATION</span>
                    <span>{formatDuration(s.durationMs)}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] block">STATE</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold uppercase ${
                        s.state === "completed"
                          ? "text-emerald-400"
                          : s.state === "running"
                          ? "text-blue-400"
                          : "text-rose-400"
                      }`}
                    >
                      {s.state === "completed" && <CheckCircle2 className="w-3 h-3" />}
                      {s.state === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {s.state === "failed" && <XCircle className="w-3 h-3" />}
                      {s.state}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectScan(s.workspace)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
