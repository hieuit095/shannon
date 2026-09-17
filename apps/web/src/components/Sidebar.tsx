"use client";

import React from "react";
import { 
  Activity, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  History, 
  Layers
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (v: string) => void;
  findingsCount: number;
  temporalRunning?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  findingsCount,
  temporalRunning = false,
}) => {
  const navItems = [
    {
      id: "control-room",
      label: "Live Control Room",
      icon: Activity,
      badge: "LIVE",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "findings",
      label: "Vulnerabilities & PoC",
      icon: ShieldAlert,
      badge: findingsCount > 0 ? findingsCount.toString() : undefined,
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    {
      id: "wizard",
      label: "Scope Configurator",
      icon: Sliders,
    },
    {
      id: "reports",
      label: "Report & Artifact Hub",
      icon: FileText,
      badge: "PDF / SARIF",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "history",
      label: "Historical Scans",
      icon: History,
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-57px)]">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        item.badgeColor || "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Engine Pipeline Architecture Quick Guide */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-[11px] space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autonomous Pipeline</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Strict &quot;No exploit, no report&quot; policy: Every vulnerability is verified through dynamic exploitation and browser replay.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-900 space-y-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="text-zinc-300">Keygraph Shannon</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Temporal</span>
          <span className={temporalRunning ? "text-emerald-400" : "text-rose-400"}>
            {temporalRunning ? "Connected (:7233)" : "Disconnected"}
          </span>
        </div>
      </div>
    </aside>
  );
};
