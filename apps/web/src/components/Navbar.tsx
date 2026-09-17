"use client";

import React from "react";
import { Shield, Terminal, Activity, Plus, Cpu, AlertCircle } from "lucide-react";
import type { SystemHealth } from "../lib/types";

interface NavbarProps {
  activeView: string;
  setActiveView: (v: string) => void;
  activeTarget: string | null;
  health: SystemHealth | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  activeTarget,
  health,
}) => {
  const dockerOnline = health?.docker.running ?? false;
  const temporalOnline = health?.temporal.running ?? false;
  const credsConfigured = health?.credentials.configured ?? false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveView("control-room")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-zinc-100 font-mono">SHANNON</span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium font-mono uppercase bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                  AI Pentest
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Autonomous AppSec & Dynamic Exploitation</p>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800 mx-2" />

          {/* Active Workspace / Target Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            {activeTarget ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400 font-mono">Active Target:</span>
                <span className="text-zinc-200 font-mono font-medium truncate max-w-[220px]">
                  {activeTarget}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="text-zinc-400 font-mono">Target:</span>
                <span className="text-zinc-500 font-mono italic">No Active Target</span>
              </>
            )}
          </div>
        </div>

        {/* System Health & Primary Action */}
        <div className="flex items-center gap-3">
          {/* Health Indicators connected to live host daemon */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
            {/* Docker Status */}
            <div
              className={`flex items-center gap-1.5 ${
                dockerOnline ? "text-emerald-400" : "text-rose-400"
              }`}
              title={health?.docker.error || (dockerOnline ? "Docker daemon is running" : "Docker daemon unreachable")}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Docker: {dockerOnline ? "Online" : "Offline"}</span>
            </div>

            <span className="text-zinc-700">|</span>

            {/* Temporal Status */}
            <div
              className={`flex items-center gap-1.5 ${
                temporalOnline ? "text-emerald-400" : "text-zinc-400"
              }`}
              title={health?.temporal.error || (temporalOnline ? "Temporal server active" : "Temporal container stopped")}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Temporal: {temporalOnline ? "Ready" : "Offline"}</span>
            </div>

            <span className="text-zinc-700">|</span>

            {/* Credentials Status */}
            <div
              className={`flex items-center gap-1.5 ${
                credsConfigured ? "text-emerald-400" : "text-amber-400"
              }`}
              title={health?.credentials.providerHint || "AI provider keys"}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>AI Keys: {credsConfigured ? "Ready" : "Missing"}</span>
            </div>
          </div>

          {/* New Scan CTA */}
          <button
            onClick={() => setActiveView("wizard")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Assessment</span>
          </button>
        </div>
      </div>
    </header>
  );
};
