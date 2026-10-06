import React, { useState } from "react";
import { 
  Rocket, Download, CheckCircle2, Copy, Check, ExternalLink, 
  Sparkles, Loader2, Globe, ShieldCheck, X
} from "lucide-react";
import { api } from "../api";

export default function DeploymentBanner({ 
  portfolioId, 
  qualityScore = 95, 
  onDownloadZip,
  onDeployed
}) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");
  const [deployedResult, setDeployedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed && !deployedResult) {
    return null;
  }

  const handleDeployLive = async () => {
    setIsDeploying(true);
    setDeployStep("Compiling layout & static assets...");
    try {
      setTimeout(() => setDeployStep("Packaging static site bundle..."), 600);
      setTimeout(() => setDeployStep("Provisioning live host & SSL domain..."), 1200);

      const result = await api.deployPortfolio(portfolioId, { provider: "auto" });
      setDeployedResult(result);
      if (onDeployed) onDeployed(result);
    } catch (err) {
      console.error("Deployment failed:", err);
      alert("Deployment failed: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyLink = () => {
    const url = deployedResult?.url || "";
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDeclineDeploy = () => {
    if (onDownloadZip) {
      onDownloadZip();
    }
    setIsDismissed(true);
  };

  return (
    <div className="w-full bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-zinc-800 relative overflow-hidden transition-all">
      
      {/* Background ambient glow */}
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

      {!deployedResult ? (
        <div className="space-y-4 relative z-10">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SCORE: {qualityScore}/100
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide">
                    Recruiter-Ready Verified
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                  Your portfolio scored <strong className="text-emerald-400 font-bold">{qualityScore}/100</strong> and is recruiter-ready!
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-zinc-500 hover:text-zinc-300 transition p-1"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl pl-12">
            Would you like me to deploy this live to the web now? It will generate a public, instant static URL ready to send to hiring managers and recruiters.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1 pl-12">
            <button
              onClick={handleDeployLive}
              disabled={isDeploying}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>{deployStep || "Deploying live..."}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Yes, Deploy Live</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeclineDeploy}
              disabled={isDeploying}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>No, Just Download ZIP</span>
            </button>
          </div>

        </div>
      ) : (
        /* Deployed Success View */
        <div className="space-y-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE & DEPLOYED
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Host: {deployedResult.provider.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Your portfolio is live on the web!
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-zinc-500 hover:text-zinc-300 transition p-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* URL Bar & Copy Button */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 min-w-0">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <a 
                href={deployedResult.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono font-medium text-emerald-300 hover:text-emerald-200 truncate underline underline-offset-2"
              >
                {deployedResult.url}
              </a>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={deployedResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
              >
                <span>Open Live Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-950" />
              </a>
            </div>
          </div>

          {/* Social Preview & Recruiter Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/80 text-[11px] font-mono text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recruiter Social Preview Ready &bull; OpenGraph Validated</span>
            </div>
            
            <button
              onClick={handleDeployLive}
              disabled={isDeploying}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline font-mono"
            >
              Re-deploy updates
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
