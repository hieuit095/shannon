"use client";

import React, { useState } from "react";
import { 
  GitBranch, 
  Globe, 
  Lock, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  Cpu
} from "lucide-react";
import type { SystemHealth } from "../lib/types";

interface WizardViewProps {
  onLaunchScan: (config: any) => Promise<{ success: boolean; error?: string; workspace?: string }>;
  systemHealth: SystemHealth | null;
}

export const WizardView: React.FC<WizardViewProps> = ({ 
  onLaunchScan,
  systemHealth
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Form State with clean production defaults
  const [name, setName] = useState("Target Assessment");
  const [targetUrl, setTargetUrl] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [agenticSast, setAgenticSast] = useState(false);

  // Auth State
  const [loginType, setLoginType] = useState<"form" | "api" | "none">("none");
  const [loginUrl, setLoginUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [successConditionType, setSuccessConditionType] = useState("url_contains");
  const [successConditionValue, setSuccessConditionValue] = useState("");

  // Rules State
  const [rulesAvoid, setRulesAvoid] = useState<string>("");
  const [rulesFocus, setRulesFocus] = useState<string>("");

  // AI & Mode State
  const [modelSpec, setModelSpec] = useState("anthropic:claude-sonnet-4-6");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [exploitMode, setExploitMode] = useState(true);

  const dockerRunning = systemHealth?.docker.running ?? false;

  const handleLaunch = async () => {
    setLaunchError(null);

    if (!targetUrl.trim()) {
      setLaunchError("Please specify a Target URL before launching.");
      setStep(1);
      return;
    }

    try {
      new URL(targetUrl.trim());
    } catch {
      setLaunchError("Invalid URL format. Please include protocol (e.g. http:// or https://).");
      setStep(1);
      return;
    }

    const payload = {
      name,
      url: targetUrl.trim(),
      repoPath: repoPath.trim() || undefined,
      loginType,
      loginUrl: loginType !== "none" ? loginUrl.trim() : undefined,
      username: loginType !== "none" ? username.trim() : undefined,
      password: loginType !== "none" ? password : undefined,
      totpSecret: loginType === "form" && totpSecret ? totpSecret.trim() : undefined,
      successConditionType: loginType === "form" ? successConditionType : undefined,
      successConditionValue: loginType === "form" ? successConditionValue.trim() : undefined,
      rulesAvoid: rulesAvoid.split("\n").map((r) => r.trim()).filter(Boolean),
      rulesFocus: rulesFocus.split("\n").map((r) => r.trim()).filter(Boolean),
      agenticSast,
      exploitMode,
      modelSpec,
      customBaseUrl: customBaseUrl.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await onLaunchScan(payload);
      if (!res.success) {
        setLaunchError(res.error || "Failed to start assessment");
      }
    } catch (err: any) {
      setLaunchError(err.message || "Network error while starting assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          Target & Scope Configurator
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Configure live application targets, authentication parameters, and execution steering
        </p>
      </div>

      {/* Docker Offline Warning Banner if host daemon is down */}
      {!dockerRunning && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-mono">
            <div className="font-bold text-rose-200">Host Docker Daemon is Offline</div>
            <p className="text-rose-300/80 leading-relaxed">
              Shannon uses ephemeral Docker containers to isolate dynamic exploits and browser execution. Please start Docker Desktop on your host before launching an assessment.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Wizard Bar */}
      <div className="grid grid-cols-4 gap-2 bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800 text-xs font-medium">
        {[
          { num: 1, title: "Target & Repo", icon: Globe },
          { num: 2, title: "Authentication", icon: Lock },
          { num: 3, title: "Rules & Scoping", icon: ShieldCheck },
          { num: 4, title: "AI & Execution", icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                isCurrent
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : isDone
                  ? "text-zinc-300 hover:bg-zinc-800/60"
                  : "text-zinc-400 hover:bg-zinc-800/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                  isCurrent
                    ? "bg-emerald-500 text-zinc-950"
                    : isDone
                    ? "bg-zinc-700 text-zinc-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Launch Error Alert Box */}
      {launchError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-mono">
            <div className="font-bold text-rose-200">Execution Error from Shannon Engine</div>
            <p className="text-rose-300 leading-relaxed break-words">{launchError}</p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        {/* Step 1: Target & Repo */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">Assessment Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60 font-mono"
                placeholder="e.g. My Web App Pentest"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                Target Web Application URL (-u) <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60 font-mono"
                placeholder="http://localhost:8080 or https://myapp.example.com"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                The live web endpoint or API accessible from Docker worker container.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                Local Source Code Path (-r) <span className="text-zinc-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60 font-mono"
                placeholder="c:/Users/USER/Documents/GitHub/target-app"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                Shannon mounts this directory read-only (:ro) to run SAST taint analysis.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Enable Capella Agentic SAST
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Inspect source code for taint paths and sinks to guide dynamic exploitation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={agenticSast}
                onChange={(e) => setAgenticSast(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Step 2: Authentication */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-2">Authentication Mechanism</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Unauthenticated" },
                  { id: "form", label: "Form Login (Playwright)" },
                  { id: "api", label: "API Bearer Token" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLoginType(type.id as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                      loginType === type.id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {loginType === "form" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Login Page URL</label>
                  <input
                    type="url"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                    placeholder="https://myapp.example.com/login"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1">Username / Email</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                      placeholder="testuser@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1">
                      TOTP 2FA Secret (Base32, Optional)
                    </label>
                    <input
                      type="text"
                      value={totpSecret}
                      onChange={(e) => setTotpSecret(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                      placeholder="JBSWY3DPEHPK3PXP"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1">
                      Login Success Match URL
                    </label>
                    <input
                      type="text"
                      value={successConditionValue}
                      onChange={(e) => setSuccessConditionValue(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                      placeholder="/dashboard or /home"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Rules & Scoping */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Avoid Rules (Critical Exclusions)
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">One path per line</span>
              </div>
              <textarea
                rows={3}
                value={rulesAvoid}
                onChange={(e) => setRulesAvoid(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                placeholder="/api/v1/payment/charge&#10;/admin/reset-database"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                Shannon will strictly avoid sending destructive payloads matching these URL patterns.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Focus Rules (Priority Targets)
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">One path per line</span>
              </div>
              <textarea
                rows={3}
                value={rulesFocus}
                onChange={(e) => setRulesFocus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                placeholder="/api/v1/auth&#10;/api/v1/profile"
              />
            </div>
          </div>
        )}

        {/* Step 4: AI & Execution */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">AI Provider & Model</label>
              <select
                value={modelSpec}
                onChange={(e) => setModelSpec(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
              >
                <option value="anthropic:claude-sonnet-4-6">Anthropic Claude 3.5 Sonnet (Recommended)</option>
                <option value="openai:gpt-4o">OpenAI GPT-4o</option>
                <option value="xai:grok-2">xAI Grok-2</option>
                <option value="amazon-bedrock:anthropic.claude-sonnet">AWS Bedrock Claude Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                Custom Base URL (vLLM / LiteLLM / Self-Hosted)
              </label>
              <input
                type="url"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono"
                placeholder="http://localhost:8000/v1 (Optional)"
              />
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Dynamic Exploitation Mode (&quot;No exploit, no report&quot;)
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  When enabled, Shannon executes real payloads and browser sessions to verify exploitability before reporting.
                </p>
              </div>
              <input
                type="checkbox"
                checked={exploitMode}
                onChange={(e) => setExploitMode(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            disabled={step === 1 || isSubmitting}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleLaunch}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Spawning Engine...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Launch Security Assessment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
