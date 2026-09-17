"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Terminal, 
  AlertOctagon, 
  Clock, 
  DollarSign, 
  Cpu, 
  CheckCircle2, 
  Loader2, 
  Shield,
  Plus
} from "lucide-react";
import type { StatusJson } from "../lib/types";

interface ControlRoomViewProps {
  status: StatusJson | null;
  logs: string[];
  onAbortScan: () => void;
  onOpenWizard: () => void;
}

export const ControlRoomView: React.FC<ControlRoomViewProps> = ({
  status,
  logs,
  onAbortScan,
  onOpenWizard,
}) => {
  const [showTerminal, setShowTerminal] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Live elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!status) return;
    const initial = status.elapsedMs ? Math.floor(status.elapsedMs / 1000) : 0;
    setElapsed(initial);
    if (status.status === "running") {
      const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  useEffect(() => {
    if (showTerminal) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showTerminal]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  if (!status) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-emerald-400">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">No Active Scan Session</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto leading-relaxed">
            There is currently no running pentest scan in <code className="text-emerald-400">./workspaces</code>. Launch an assessment to observe the live pipeline, parallel agent lanes, and real-time terminal output.
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

  const isRunning = status.status === "running";
  const exploitationAgents = status.phases?.find((p) => p.key === "exploitation")?.agents || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase ${
                isRunning
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : status.status === "completed"
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              {status.status}
            </span>
            <span className="text-zinc-200 font-mono text-xs font-semibold">{status.workspace}</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Workflow: {status.workflowId || status.workspace} | Status: {status.temporalStatus}
          </p>
        </div>

        {/* Action Controls & Metrics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatSeconds(elapsed)}</span>
            </div>
            {status.costUsd !== undefined && status.costUsd !== null && (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>${status.costUsd.toFixed(2)}</span>
              </div>
            )}
            {status.totalTurns !== undefined && status.totalTurns !== null && (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>{status.totalTurns} Turns</span>
              </div>
            )}
          </div>

          {isRunning && (
            <button
              onClick={onAbortScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Abort Scan</span>
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Stage Stepper */}
      {status.phases && status.phases.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Pipeline Execution DAG
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {status.phases.map((phase, idx) => {
              const isCompleted = phase.state === "completed";
              const isPhaseRunning = phase.state === "running";
              return (
                <div
                  key={phase.key}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isPhaseRunning
                      ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : isCompleted
                      ? "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                      : "bg-zinc-950/40 border-zinc-900 text-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-zinc-400">Step 0{idx + 1}</span>
                    {isPhaseRunning && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="font-semibold truncate text-[11px]">{phase.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Parallel Lanes & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Parallel Agents Activity Tree */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Exploitation Lanes
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {exploitationAgents.length} Agents
            </span>
          </div>

          <div className="space-y-2.5">
            {exploitationAgents.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center text-xs font-mono text-zinc-500">
                No active exploitation agents in current phase.
              </div>
            ) : (
              exploitationAgents.map((agent) => {
                const isAgentRun = agent.state === "running";
                const isAgentComp = agent.state === "completed";
                return (
                  <div
                    key={agent.name}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAgentRun && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
                        {isAgentComp && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="text-xs font-semibold text-zinc-200">{agent.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {agent.durationMs
                          ? `${(agent.durationMs / 1000).toFixed(0)}s`
                          : isAgentRun
                          ? "Running"
                          : "Pending"}
                      </span>
                    </div>
                    {agent.detail && (
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pl-5">
                        {agent.detail}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Terminal Drawer */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Execution Logs (.shannon/workflow.log)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              LIVE STREAM
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 space-y-1 h-80 overflow-y-auto shadow-inner">
            {logs.length === 0 ? (
              <div className="text-zinc-600 italic">No log entries streamed yet...</div>
            ) : (
              logs.map((line, i) => (
                <div key={i} className="leading-5 hover:bg-zinc-900/50 px-1 rounded flex">
                  <span className="text-zinc-600 select-none mr-2 w-7 shrink-0 text-right">{i + 1}</span>
                  <span className={line.includes("IMPACT") || line.includes("FAILED") || line.includes("ERROR") ? "text-rose-400 font-semibold" : line.includes("CONFIRMED") || line.includes("COMPLETED") ? "text-emerald-400" : "text-zinc-300"}>
                    {line}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
