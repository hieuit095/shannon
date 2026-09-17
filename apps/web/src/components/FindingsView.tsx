"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Code, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Filter,
  FileCode,
  Layers,
  Plus
} from "lucide-react";
import type { ShannonFinding, Severity, FindingStatus } from "../lib/types";

interface FindingsViewProps {
  findings: ShannonFinding[];
  workspace?: string | null;
  onOpenWizard?: () => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ 
  findings, 
  workspace,
  onOpenWizard 
}) => {
  const [selectedId, setSelectedId] = useState<string>(findings[0]?.finding_id || "");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // Sync selected finding when findings change
  const selectedFinding = findings.find((f) => f.finding_id === selectedId) || findings[0];

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    return true;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case "critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (findings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">
            {workspace ? `No Exploited Vulnerabilities for ${workspace}` : "No Vulnerabilities Recorded"}
          </h2>
          <p className="text-xs text-zinc-400 font-mono max-w-lg mx-auto leading-relaxed">
            Shannon strictly enforces a &quot;No exploit, no report&quot; policy. Vulnerabilities are only recorded in <code className="text-emerald-400">.shannon/report.json</code> after an autonomous agent achieves verified dynamic exploitation and generates a reproducible PoC.
          </p>
        </div>
        {onOpenWizard && (
          <button
            onClick={onOpenWizard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Assessment</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Severity:</span>
          </div>
          <div className="flex items-center gap-1">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all cursor-pointer ${
                  severityFilter === sev
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400">Status:</span>
          {["all", "exploited", "blocked"].map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all cursor-pointer ${
                statusFilter === stat
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Finding List */}
        <div className="lg:col-span-4 space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
          {filteredFindings.map((f) => {
            const isSelected = f.finding_id === (selectedFinding?.finding_id || selectedId);
            return (
              <div
                key={f.finding_id}
                onClick={() => setSelectedId(f.finding_id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-zinc-800/90 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                    : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-200">{f.finding_id}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getSeverityBadge(
                        f.severity
                      )}`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                    {f.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">{f.title}</h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-1 line-clamp-1 truncate">
                  {f.vulnerable_location}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Finding Detail Panel */}
        {selectedFinding && (
          <div className="lg:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6 max-h-[calc(100vh-210px)] overflow-y-auto">
            {/* Header */}
            <div className="space-y-2 border-b border-zinc-800 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">{selectedFinding.finding_id}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getSeverityBadge(
                      selectedFinding.severity
                    )}`}
                  >
                    {selectedFinding.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {selectedFinding.owasp_category}
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                  STATUS: {selectedFinding.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100">{selectedFinding.title}</h2>
              {selectedFinding.severity_rationale && (
                <p className="text-xs text-emerald-400/90 font-mono bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                  {selectedFinding.severity_rationale}
                </p>
              )}
            </div>

            {/* Endpoints & Source Code Sink Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Vulnerable Endpoint / Target
                </span>
                <div className="font-mono text-xs text-zinc-200 break-all select-all font-semibold">
                  {selectedFinding.vulnerable_location}
                </div>
              </div>

              {selectedFinding.code_locations && selectedFinding.code_locations.length > 0 && (
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-emerald-400" />
                    Capella SAST Source Sink
                  </span>
                  <div className="font-mono text-xs text-zinc-200">
                    {selectedFinding.code_locations[0].file}
                    {selectedFinding.code_locations[0].start_line && (
                      <span className="text-emerald-400 font-bold ml-1">
                        :L{selectedFinding.code_locations[0].start_line}
                      </span>
                    )}
                    {selectedFinding.code_locations[0].symbol && (
                      <span className="text-zinc-500 ml-1">
                        ({selectedFinding.code_locations[0].symbol})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Overview & Impact */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase">Executive Overview</h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                {selectedFinding.overview}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase">Demonstrated Business Impact</h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                {selectedFinding.impact}
              </p>
            </div>

            {/* Proof of Concept Reproduction Playbook */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-zinc-200 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Reproducible Proof of Concept (PoC Steps)
                </h3>
              </div>

              <div className="space-y-4">
                {selectedFinding.exploitation_steps?.map((step, idx) => (
                  <div key={idx} className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    {step.title && (
                      <h4 className="text-xs font-semibold text-zinc-200 font-mono flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {step.title}
                      </h4>
                    )}
                    <div className="space-y-2 pl-7">
                      {step.items?.map((item, itemIdx) => (
                        <div key={itemIdx}>
                          {item.kind === "prose" && (
                            <p className="text-xs text-zinc-400 font-mono">{item.text}</p>
                          )}
                          {item.kind === "code" && item.block && (
                            <div className="relative group mt-1">
                              <pre className="p-3 rounded-lg bg-zinc-900 font-mono text-xs text-emerald-300 overflow-x-auto border border-zinc-800 select-all">
                                {item.block.content}
                              </pre>
                              <button
                                onClick={() => copyToClipboard(item.block!.content)}
                                className="absolute right-2 top-2 px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                {copied ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proof of Impact Evidence */}
            {selectedFinding.proof_of_impact && selectedFinding.proof_of_impact.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-semibold text-rose-300 uppercase">
                  Proof of Impact (Exfiltrated Evidence)
                </h3>
                <div className="bg-zinc-950 p-4 rounded-xl border border-rose-900/30 space-y-2">
                  {selectedFinding.proof_of_impact.map((item, idx) => (
                    <div key={idx}>
                      {item.kind === "prose" && (
                        <p className="text-xs text-zinc-300 font-mono">{item.text}</p>
                      )}
                      {item.kind === "code" && item.block && (
                        <pre className="p-3 rounded-lg bg-zinc-900 font-mono text-xs text-rose-300 overflow-x-auto border border-zinc-800 select-all">
                          {item.block.content}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-semibold text-emerald-300 uppercase">
                Actionable Remediation Guidance
              </h3>
              <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-900/30 text-xs text-zinc-200 font-mono leading-relaxed">
                {selectedFinding.remediation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
