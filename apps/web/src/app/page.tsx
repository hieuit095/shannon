"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { ControlRoomView } from "../components/ControlRoomView";
import { FindingsView } from "../components/FindingsView";
import { WizardView } from "../components/WizardView";
import { ReportsView } from "../components/ReportsView";
import { HistoryView } from "../components/HistoryView";
import type { StatusJson, ShannonFinding, SystemHealth } from "../lib/types";

export default function Home() {
  const [activeView, setActiveView] = useState<string>("control-room");
  const [scans, setScans] = useState<
    Array<{
      workspace: string;
      state: "running" | "completed" | "failed";
      finishedAt: string | null;
      durationMs: number | null;
      reportPath: string | null;
    }>
  >([]);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [findings, setFindings] = useState<ShannonFinding[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch system health (Docker daemon, Temporal, Credentials)
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Health check error:", err);
    }
  }, []);

  // 2. Fetch list of real scans from Shannon CLI and disk
  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch("/api/scans");
      if (res.ok) {
        const data = await res.json();
        const scanList = data.scans || [];
        setScans(scanList);

        // If no active workspace is selected yet, pick running or latest
        setActiveWorkspace((current) => {
          if (current && scanList.some((s: any) => s.workspace === current)) {
            return current;
          }
          const running = scanList.find((s: any) => s.state === "running");
          if (running) return running.workspace;
          if (scanList.length > 0) return scanList[0].workspace;
          return null;
        });

        if (data.active && !status) {
          setStatus(data.active);
        }
      }
    } catch (err) {
      console.error("Fetch scans error:", err);
    }
  }, [status]);

  // Initial load and periodic polling
  useEffect(() => {
    fetchHealth();
    fetchScans();

    const healthInterval = setInterval(fetchHealth, 6000);
    const scansInterval = setInterval(fetchScans, 10000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(scansInterval);
    };
  }, [fetchHealth, fetchScans]);

  // 3. Connect to live SSE stream & findings when activeWorkspace changes
  useEffect(() => {
    if (!activeWorkspace) {
      setStatus(null);
      setFindings([]);
      setLogs([]);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Fetch initial status
    fetch(`/api/scans/${activeWorkspace}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) setStatus(data);
      })
      .catch(() => {});

    // Fetch findings for this workspace
    fetch(`/api/scans/${activeWorkspace}/findings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.findings) setFindings(data.findings);
      })
      .catch(() => {});

    // Open real-time SSE stream for logs and status updates
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/scans/${activeWorkspace}/stream`);
    eventSourceRef.current = sse;

    sse.addEventListener("status", (e) => {
      try {
        const updated = JSON.parse(e.data);
        setStatus(updated);
      } catch {}
    });

    sse.addEventListener("log", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.line) {
          setLogs((prev) => {
            if (prev.includes(parsed.line)) return prev;
            return [...prev, parsed.line];
          });
        }
      } catch {}
    });

    sse.onerror = () => {
      // SSE reconnects automatically
    };

    return () => {
      sse.close();
      eventSourceRef.current = null;
    };
  }, [activeWorkspace]);

  // 4. Handle Launch Scan (invoked from WizardView)
  const handleLaunchScan = async (config: any) => {
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || `HTTP error ${res.status}: Failed to start scan`,
        };
      }

      showToast(`Scan launched: ${data.workspace}`);
      setActiveWorkspace(data.workspace);
      setActiveView("control-room");
      fetchScans();
      return { success: true, workspace: data.workspace };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error launching scan" };
    }
  };

  // 5. Handle Abort Scan
  const handleAbortScan = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/scans/${activeWorkspace}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Scan ${activeWorkspace} abort requested.`);
        setStatus((prev) => (prev ? { ...prev, status: "cancelled", temporalStatus: "CANCELLED" } : null));
        fetchScans();
      } else {
        showToast(`Failed to abort scan: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      showToast(`Error requesting abort: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        activeTarget={activeWorkspace}
        health={health}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          findingsCount={findings.length}
          temporalRunning={health?.temporal.running ?? false}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-57px)]">
          {activeView === "control-room" && (
            <ControlRoomView
              status={status}
              logs={logs}
              onAbortScan={handleAbortScan}
              onOpenWizard={() => setActiveView("wizard")}
            />
          )}

          {activeView === "findings" && (
            <FindingsView
              findings={findings}
              workspace={activeWorkspace}
              onOpenWizard={() => setActiveView("wizard")}
            />
          )}

          {activeView === "wizard" && (
            <WizardView
              onLaunchScan={handleLaunchScan}
              systemHealth={health}
            />
          )}

          {activeView === "reports" && (
            <ReportsView
              workspace={activeWorkspace}
              scans={scans}
              onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
              onOpenWizard={() => setActiveView("wizard")}
            />
          )}

          {activeView === "history" && (
            <HistoryView
              scans={scans}
              activeScanId={activeWorkspace}
              onSelectScan={(ws) => {
                setActiveWorkspace(ws);
                setActiveView("control-room");
              }}
              onOpenWizard={() => setActiveView("wizard")}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
