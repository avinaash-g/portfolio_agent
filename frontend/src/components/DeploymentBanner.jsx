import React, { useState, useEffect } from "react";
import { 
  Rocket, Download, CheckCircle2, Copy, Check, ExternalLink, 
  Sparkles, Loader2, Globe, ShieldCheck, X
} from "lucide-react";
import { api } from "../api";

export default function DeploymentBanner({ 
  portfolioId, 
  qualityScore = 95, 
  initialDeploymentUrl = null,
  initialProvider = "Public Cloud",
  onDownloadZip,
  onDeployed
}) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");
  const [deployedResult, setDeployedResult] = useState(
    initialDeploymentUrl ? { url: initialDeploymentUrl, provider: initialProvider } : null
  );
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (initialDeploymentUrl && (!deployedResult || deployedResult.url !== initialDeploymentUrl)) {
      setDeployedResult({ url: initialDeploymentUrl, provider: initialProvider });
    }
  }, [initialDeploymentUrl, initialProvider]);

  if (isDismissed && !deployedResult) {
    return null;
  }

  const handleDeployLive = async () => {
    setIsDeploying(true);
    setDeployStep("Compiling layout & static assets...");
    try {
      setTimeout(() => setDeployStep("Packaging static site bundle..."), 600);
      setTimeout(() => setDeployStep("Deploying to public cloud & provisioning SSL..."), 1200);

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
    <div 
      id="deploy-banner"
      className="w-full bg-white text-[#1B1F3B] rounded-2xl p-5 sm:p-6 shadow-soft border border-[#E5DFD7] relative overflow-hidden transition-all scroll-mt-20"
    >
      {!deployedResult ? (
        <div className="space-y-4 relative z-10">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#6B3074]/15 border border-[#6B3074]/25 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#6B3074]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6B3074]/10 text-[#6B3074] border border-[#6B3074]/20">
                    SCORE: {qualityScore}/100
                  </span>
                  <span className="text-[11px] font-bold text-[#1B1F3B]/70 uppercase tracking-wide">
                    Recruiter-Ready Verified
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1B1F3B] mt-1">
                  Your portfolio scored <strong className="text-[#6B3074] font-bold">{qualityScore}/100</strong> and is ready for public deployment!
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-[#1B1F3B]/40 hover:text-[#1B1F3B] transition p-1"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#1B1F3B]/75 leading-relaxed max-w-2xl pl-12">
            Deploy this portfolio live to the public web now. Generates a genuine, permanent public HTTPS link that anyone—recruiters, hiring managers, or friends on mobile devices—can open immediately without localhost.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1 pl-12">
            <button
              onClick={handleDeployLive}
              disabled={isDeploying}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs shadow-coral transition disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{deployStep || "Deploying live to public cloud..."}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5 text-white" />
                  <span>Yes, Deploy to Public Web</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeclineDeploy}
              disabled={isDeploying}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#EAE4DC] text-[#1B1F3B] font-semibold text-xs border border-[#DCD5CB] transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#1B1F3B]/60" />
              <span>No, Just Download ZIP</span>
            </button>
          </div>

        </div>
      ) : (
        /* Deployed Success View */
        <div className="space-y-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    PUBLIC WEB LIVE
                  </span>
                  <span className="text-[11px] font-mono text-[#1B1F3B]/60 font-semibold">
                    Host: {(deployedResult.provider || "Cloud").toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1B1F3B] mt-1">
                  Your portfolio is live on the public web!
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-[#1B1F3B]/40 hover:text-[#1B1F3B] transition p-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* URL Bar & Copy Button */}
          <div className="p-3 bg-[#FAF7F4] rounded-xl border border-[#E5DFD7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 min-w-0">
              <Globe className="w-4 h-4 text-[#6B3074] shrink-0" />
              <a 
                href={deployedResult.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-[#6B3074] hover:underline truncate"
              >
                {deployedResult.url}
              </a>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-xs font-mono text-[#1B1F3B] font-semibold border border-[#DCD5CB] transition shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Public Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#1B1F3B]/50" />
                    <span>Copy Public Link</span>
                  </>
                )}
              </button>

              <a
                href={deployedResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs transition shadow-coral"
              >
                <span>Open Live Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>

          {/* Social Preview & Recruiter Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#1B1F3B]/60">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF7F4] border border-[#E5DFD7] text-[11px] font-mono text-[#1B1F3B]/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Global HTTPS &bull; Mobile & Recruiter Accessible (Zero Localhost)</span>
            </div>
            
            <button
              onClick={handleDeployLive}
              disabled={isDeploying}
              className="text-[11px] text-[#6B3074] hover:underline font-mono font-semibold"
            >
              Re-deploy updates
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
