import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Terminal, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Rocket, 
  Code2, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Zap, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  FileCheck2,
  Lock
} from "lucide-react";

export default function LandingPage({ onLaunchStudio, onOpenApiKeyModal }) {
  // Terminal widget state
  const [activeStep, setActiveStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Auto-play simulation when triggered
  useEffect(() => {
    let timer;
    if (isSimulating) {
      if (activeStep < 3) {
        timer = setTimeout(() => {
          setActiveStep((prev) => prev + 1);
        }, 1600);
      } else {
        setIsSimulating(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulating, activeStep]);

  const handleRunSimulation = () => {
    setActiveStep(1);
    setIsSimulating(true);
  };

  const curlCode = `curl -X POST https://portfolio-agent.dev/api/v1/generate \\
  -H "X-API-Key: pa_live_9b8a2c1f4e7d..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alex Rivera",
    "target_role": "Distributed Systems Engineer",
    "skills": ["Rust", "Go", "Kafka", "PostgreSQL", "Raft"],
    "projects": [
      {
        "name": "TitanKV",
        "description": "High performance distributed key-value store using Raft consensus.",
        "technologies": ["Rust", "gRPC", "RocksDB"],
        "role": "Lead Architect",
        "outcomes": "Sustains 120k write ops/sec with p99 latency under 2ms."
      }
    ],
    "layout_id": "modern_grid",
    "theme_id": "luxury_saas"
  }'`;

  const pythonCode = `import requests

url = "https://portfolio-agent.dev/api/v1/generate"
headers = {
    "X-API-Key": "pa_live_9b8a2c1f4e7d...",
    "Content-Type": "application/json"
}

payload = {
    "name": "Alex Rivera",
    "target_role": "Distributed Systems Engineer",
    "skills": ["Rust", "Go", "Kafka", "PostgreSQL", "Raft"],
    "projects": [
        {
            "name": "TitanKV",
            "description": "High performance distributed key-value store using Raft consensus.",
            "technologies": ["Rust", "gRPC", "RocksDB"],
            "role": "Lead Architect",
            "outcomes": "Sustains 120k write ops/sec with p99 latency under 2ms."
        }
    ],
    "layout_id": "modern_grid",
    "theme_id": "luxury_saas"
}

res = requests.post(url, json=payload, headers=headers)
data = res.json()

# Inspect verified STAR case study & quality audit
print("Quality Score:", data["quality_report"]["score"]) # 98/100
print("Role Narrative:", data["portfolio"]["hero"]["tagline"])`;

  return (
    <div className="min-h-screen bg-[#F3EFEA] text-[#1B1F3B] selection:bg-[#6B3074] selection:text-white flex flex-col">
      
      {/* Background Subtle Editorial Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="pt-16 pb-14 md:pt-24 md:pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center space-y-7">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F4] border border-[#E5DFD7] shadow-soft text-xs text-[#1B1F3B] animate-subtle-fade">
            <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
            <span className="font-bold text-[#1B1F3B]">Developer Platform</span>
            <span className="text-[#1B1F3B]/30">•</span>
            <span className="text-[#6B3074] font-semibold">Programmatic REST API & Interactive Studio</span>
          </div>

          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] text-[#1B1F3B]">
              Autonomous Portfolio Engineering for{" "}
              <span className="text-[#6B3074]">Developers & Teams</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#1B1F3B]/75 max-w-2xl mx-auto font-normal leading-relaxed">
              Turn raw project commits and resumes into recruiter-ready case studies. Available via our Interactive Studio or Programmatic REST API.
            </p>
          </div>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-sm shadow-coral transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Launch Portfolio Studio</span>
              <ArrowRight className="w-4 h-4 text-white/90" />
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#E5DFD7] text-[#1B1F3B] font-semibold text-sm transition-all duration-200 shadow-soft"
            >
              <Key className="w-4 h-4 text-[#6B3074]" />
              <span>Get API Key</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#6B3074]/10 text-[#6B3074] font-mono font-medium">
                Free 10/day
              </span>
            </button>
          </div>

          {/* Stats Micro-Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#1B1F3B]/75">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#6B3074]" />
              <span><strong className="text-[#1B1F3B]">Zero-Hallucination</strong> Guardrails</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#6B3074]" />
              <span><strong className="text-[#1B1F3B]">STAR Methodology</strong> Case Studies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#FF6B6B]" />
              <span><strong className="text-[#1B1F3B]">&lt;250ms</strong> REST Gateway</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE INTERACTIVE TERMINAL WIDGET (LIGHT EDITORIAL DESIGN) */}
          {/* ========================================================================= */}
          <div className="pt-5 max-w-5xl mx-auto w-full text-left">
            <div className="rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] shadow-card overflow-hidden">
              
              {/* Chrome Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#F3EFEA] border-b border-[#E5DFD7] gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B6B]/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-[#6B3074]/60" />
                  <span className="ml-2 font-mono text-xs text-[#1B1F3B]/70 flex items-center gap-1.5 font-medium">
                    <Terminal className="w-3.5 h-3.5 text-[#6B3074]" />
                    portfolio-agent-engine ~ autonomous-synthesis
                  </span>
                </div>

                {/* Step Switcher Tabs */}
                <div className="flex items-center space-x-1 p-1 bg-[#FAF7F4] border border-[#E5DFD7] rounded-xl text-xs font-mono">
                  <button
                    onClick={() => setActiveStep(1)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeStep === 1
                        ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                        : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
                    }`}
                  >
                    1. Raw Input JSON
                  </button>
                  <button
                    onClick={() => setActiveStep(2)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeStep === 2
                        ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                        : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
                    }`}
                  >
                    2. Agent Audit & Synthesis
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeStep === 3
                        ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                        : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
                    }`}
                  >
                    3. Recruiter Scorecard (98/100)
                  </button>
                </div>

                {/* Interactive Simulate Button */}
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-[#1B1F3B] text-xs font-semibold border border-[#E5DFD7] shadow-xs transition"
                >
                  {isSimulating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-[#6B3074] animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#FF6B6B] fill-[#FF6B6B]" />
                      <span>Run Demo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Tab Content */}
              <div className="p-5 font-mono text-xs sm:text-sm min-h-[290px] flex flex-col justify-between bg-white">
                
                {activeStep === 1 && (
                  <div className="space-y-3 animate-subtle-fade">
                    <div className="flex items-center justify-between text-[#1B1F3B]/60 pb-2 border-b border-[#E5DFD7] text-xs font-sans">
                      <span>Payload Source: git-commits + raw resume dump</span>
                      <span className="text-[#FF6B6B] font-medium flex items-center gap-1">
                        ⚠️ 2 Gaps Detected (Missing metrics, unformatted STAR)
                      </span>
                    </div>
                    <pre className="text-[#1B1F3B] overflow-x-auto leading-relaxed p-3 bg-[#FAF7F4] rounded-xl border border-[#E5DFD7]">
{`{
  "developer": "Alex Rivera",
  "target_role": "Lead Backend Architect",
  "commits": [
    "feat(engine): refactored memory cache to skip locks",
    "perf: reduced p99 write latency with batch queues"
  ],
  "raw_project": {
    "title": "TitanKV",
    "notes": "Built a fast key-value store in Rust. Uses Raft consensus. Pretty fast."
  }
}`}
                    </pre>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3 animate-subtle-fade">
                    <div className="flex items-center justify-between text-[#1B1F3B]/60 pb-2 border-b border-[#E5DFD7] text-xs font-sans">
                      <span className="text-[#6B3074] flex items-center gap-1.5 font-bold">
                        <Cpu className="w-3.5 h-3.5 animate-pulse text-[#6B3074]" />
                        8-Stage Agent Pipeline Executing...
                      </span>
                      <span className="text-emerald-700 font-semibold">Deterministic Guardrails: ACTIVE</span>
                    </div>
                    <div className="space-y-2.5 text-[#1B1F3B] text-xs sm:text-sm p-4 bg-[#FAF7F4] rounded-xl border border-[#E5DFD7]">
                      <div className="flex items-start space-x-2">
                        <span className="text-[#6B3074] font-bold">[1/8] Profile Analyzer:</span>
                        <span>Identified candidate strengths in Rust, concurrency, and distributed protocols.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-[#6B3074] font-bold">[3/8] Gap Detector:</span>
                        <span>Resolved missing benchmarks using verified commit context (120k ops/sec throughput).</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-[#1B1F3B] font-bold">[4/8] Planner:</span>
                        <span>Structured 3-column Bento architecture with interactive STAR modal drilldown.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-700 font-bold">[6/8] Case Study Generator:</span>
                        <span>Synthesized Situation, Task, Action, and Measurable Results without hallucination.</span>
                      </div>
                      <div className="flex items-start space-x-2 text-[#6B3074] pl-4 border-l-2 border-[#6B3074]">
                        <span className="font-semibold">→ "TitanKV: High-Throughput Raft Storage Engine in Rust"</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4 animate-subtle-fade">
                    <div className="flex items-center justify-between text-[#1B1F3B]/60 pb-2 border-b border-[#E5DFD7] text-xs font-sans">
                      <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Portfolio Audit Passed: 98/100 Recruiter Readiness
                      </span>
                      <span className="text-[#1B1F3B]/60">Cloud Artifact: Ready to Deploy</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
                      <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] space-y-1">
                        <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Quality Score</div>
                        <div className="text-2xl font-extrabold text-[#1B1F3B]">98 / 100</div>
                        <div className="text-[11px] text-[#1B1F3B]/70">All 7 rubric dimensions passed</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] space-y-1">
                        <div className="text-[#6B3074] text-xs font-bold uppercase tracking-wider">STAR Structure</div>
                        <div className="text-base font-bold text-[#1B1F3B]">100% Grounded</div>
                        <div className="text-[11px] text-[#1B1F3B]/70">Zero unsupported metric claims</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] space-y-1">
                        <div className="text-[#FF6B6B] text-xs font-bold uppercase tracking-wider">Role Alignment</div>
                        <div className="text-base font-bold text-[#1B1F3B]">Lead Backend Architect</div>
                        <div className="text-[11px] text-[#1B1F3B]/70">Tailored narrative storyline</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] text-xs space-y-1 text-[#1B1F3B] font-sans">
                      <span className="text-xs font-bold text-[#1B1F3B] flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-[#6B3074]" />
                        Generated STAR Case Study Sample:
                      </span>
                      <p className="text-[#1B1F3B]/80 leading-relaxed text-[12px]">
                        <strong>Action & Result:</strong> Architected a lock-free write path and RocksDB storage engine in Rust, sustaining <strong>120,000 writes/sec</strong> with sub-2ms p99 latency during multi-node consensus failovers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Step Progression Dots */}
                <div className="pt-3.5 mt-2 border-t border-[#E5DFD7] flex items-center justify-between text-xs font-sans text-[#1B1F3B]/60">
                  <div className="flex items-center space-x-2">
                    <span>Pipeline Progression:</span>
                    <div className="flex space-x-1.5">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                            activeStep >= step ? "bg-[#6B3074]" : "bg-[#DCD5CB]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStep((prev) => (prev % 3) + 1)}
                    className="inline-flex items-center space-x-1 text-[#6B3074] font-semibold hover:text-[#5E1B89] transition"
                  >
                    <span>{activeStep === 3 ? "Reset to Input" : "Next Stage"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* VALUE PROPOSITIONS & CAPABILITIES (LIGHT EDITORIAL CARDS) */}
        {/* ========================================================================= */}
        <section className="py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12 border-t border-[#E5DFD7]">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
              Built for High-Signal Technical Evaluation
            </h2>
            <p className="text-sm sm:text-base text-[#1B1F3B]/75">
              Modern hiring managers and recruiters spend under 30 seconds on a portfolio. We ensure every pixel communicates engineering depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] hover:border-[#6B3074]/50 shadow-soft hover:shadow-card transition-all duration-200 space-y-3.5 group">
              <div className="w-12 h-12 rounded-xl bg-[#6B3074]/10 border border-[#6B3074]/20 flex items-center justify-center text-[#6B3074] group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1B1F3B] tracking-tight">
                Zero-Hallucination Case Studies
              </h3>
              <p className="text-xs text-[#1B1F3B]/75 leading-relaxed">
                Strict STAR framework synthesis grounded 100% in your actual repositories, technologies, and achievements. No fabricated metrics or exaggerated claims.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] hover:border-[#6B3074]/50 shadow-soft hover:shadow-card transition-all duration-200 space-y-3.5 group">
              <div className="w-12 h-12 rounded-xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF6B6B] group-hover:scale-105 transition">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1B1F3B] tracking-tight">
                Multi-Layout Architectures
              </h3>
              <p className="text-xs text-[#1B1F3B]/75 leading-relaxed">
                Switch instantly between Bento Grid, Narrative Timeline, and Minimalist Terminal layouts. Dynamic prompt tailoring matches your target company aesthetic.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] hover:border-[#6B3074]/50 shadow-soft hover:shadow-card transition-all duration-200 space-y-3.5 group">
              <div className="w-12 h-12 rounded-xl bg-[#6B3074]/10 border border-[#6B3074]/20 flex items-center justify-center text-[#6B3074] group-hover:scale-105 transition">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1B1F3B] tracking-tight">
                Quality Scoring & Gap Detection
              </h3>
              <p className="text-xs text-[#1B1F3B]/75 leading-relaxed">
                Autonomous 7-rubric quality scorecard (0-100) tests technical depth, readability, and evidence before generation. Identifies missing metrics and clarifies gaps.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] hover:border-[#6B3074]/50 shadow-soft hover:shadow-card transition-all duration-200 space-y-3.5 group">
              <div className="w-12 h-12 rounded-xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF6B6B] group-hover:scale-105 transition">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1B1F3B] tracking-tight">
                One-Click Cloud Deployment
              </h3>
              <p className="text-xs text-[#1B1F3B]/75 leading-relaxed">
                Instant recruiter-ready deployment URLs, exportable standalone ZIP bundles with zero unrendered placeholders, and full version history rollbacks.
              </p>
            </div>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* DEVELOPER API PLATFORM SECTION */}
        {/* ========================================================================= */}
        <section className="py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12 border-t border-[#E5DFD7]">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#6B3074]/10 border border-[#6B3074]/20 text-xs font-mono text-[#6B3074] font-semibold">
                <Code2 className="w-3.5 h-3.5" />
                <span>REST API v1.0 Gateway</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
                Programmatic Synthesis for Developer Workflows
              </h2>
              <p className="text-sm sm:text-base text-[#1B1F3B]/75 leading-relaxed">
                Integrate portfolio generation into GitHub Actions, student bootcamp platforms, or internal recruiting tooling using our developer REST endpoint with rate-limited quotas.
              </p>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  onClick={onOpenApiKeyModal}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs sm:text-sm shadow-coral transition"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate API Key</span>
                </button>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#E5DFD7] text-[#1B1F3B] text-xs sm:text-sm font-semibold transition"
                >
                  <span>Interactive Swagger</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Usage Limits Breakdown Card */}
            <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] shadow-card space-y-4">
              <h3 className="text-xs font-bold text-[#1B1F3B] uppercase tracking-wider flex items-center justify-between">
                <span>Tier Quotas & Allowances</span>
                <span className="text-[10px] text-[#6B3074] font-mono">Daily Quota</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Free Tier */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B1F3B]">Free Developer Tier</span>
                    <span className="font-mono text-emerald-700 font-bold">10 req / day</span>
                  </div>
                  <ul className="text-[#1B1F3B]/75 space-y-1 text-[11px]">
                    <li>• Full STAR case study extraction</li>
                    <li>• Quality audit & 0-100 scorecard</li>
                    <li>• Standalone HTML & JSON payloads</li>
                    <li>• Standard rate limiting</li>
                  </ul>
                </div>

                {/* Pro Tier */}
                <div className="p-3.5 rounded-xl bg-[#6B3074]/5 border border-[#6B3074]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B1F3B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#6B3074]" />
                      Pro & Enterprise
                    </span>
                    <span className="font-mono text-[#6B3074] font-bold">500+ req / day</span>
                  </div>
                  <ul className="text-[#1B1F3B]/75 space-y-1 text-[11px]">
                    <li>• Priority Gemini 3.8 Flash model inference</li>
                    <li>• Custom domain cloud deployment</li>
                    <li>• Webhook callbacks & team analytics</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Code Snippets Box */}
          <div className="rounded-2xl bg-[#FAF7F4] border border-[#E5DFD7] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#F3EFEA] border-b border-[#E5DFD7]">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#6B3074]/10 text-[#6B3074] border border-[#6B3074]/20">
                  POST /api/v1/generate
                </span>
                <span className="text-xs text-[#1B1F3B]/60 hidden sm:inline font-mono">
                  Header: X-API-Key: pa_live_...
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-white border border-[#E5DFD7] text-xs">
                  <button
                    onClick={() => setActiveCodeTab("curl")}
                    className={`px-3 py-1 rounded-md transition ${
                      activeCodeTab === "curl"
                        ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                        : "text-[#1B1F3B]/70 hover:text-[#1B1F3B]"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("python")}
                    className={`px-3 py-1 rounded-md transition ${
                      activeCodeTab === "python"
                        ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                        : "text-[#1B1F3B]/70 hover:text-[#1B1F3B]"
                    }`}
                  >
                    Python
                  </button>
                </div>

                <button
                  onClick={() => {
                    const text = activeCodeTab === "curl" ? curlCode : pythonCode;
                    navigator.clipboard.writeText(text);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-[#1B1F3B] text-xs font-semibold border border-[#E5DFD7] shadow-xs transition"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#1B1F3B]" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="p-5 font-mono text-xs sm:text-sm text-[#1B1F3B] bg-white overflow-x-auto leading-relaxed max-h-[380px]">
              {activeCodeTab === "curl" ? curlCode : pythonCode}
            </pre>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* BOTTOM CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="py-16 md:py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#FAF7F4] border border-[#E5DFD7] shadow-card space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
              Ready to Upgrade Your Developer Presence?
            </h2>
            <p className="text-sm sm:text-base text-[#1B1F3B]/75 max-w-xl mx-auto leading-relaxed">
              Launch our interactive studio in seconds or generate your free developer API key to automate your engineering case studies.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={onLaunchStudio}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-sm shadow-coral transition transform hover:-translate-y-0.5"
              >
                <span>Launch Portfolio Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenApiKeyModal}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#EAE4DC] border border-[#E5DFD7] text-[#1B1F3B] font-semibold text-sm transition shadow-soft"
              >
                <Key className="w-4 h-4 text-[#6B3074]" />
                <span>Get Free API Key</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER */}
        {/* ========================================================================= */}
        <footer className="mt-auto py-8 border-t border-[#E5DFD7] px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#1B1F3B]/60 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#6B3074] flex items-center justify-center font-bold text-white text-[10px]">
              PA
            </div>
            <span className="text-[#1B1F3B] font-bold">Portfolio Agent</span>
            <span>© 2026</span>
          </div>

          <div className="flex items-center space-x-6 text-[#1B1F3B]/70 font-medium">
            <button onClick={onLaunchStudio} className="hover:text-[#1B1F3B] transition">
              Portfolio Studio
            </button>
            <button onClick={onOpenApiKeyModal} className="hover:text-[#1B1F3B] transition">
              Developer API
            </button>
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-[#1B1F3B] transition">
              API Docs
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
