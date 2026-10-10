import React from "react";
import { 
  CheckCircle2, Circle, Loader2, AlertCircle, 
  Terminal, ArrowRight, Cpu, Sparkles 
} from "lucide-react";

const STAGES = [
  { id: "profile", label: "Profile Analysis", desc: "Extracting core competencies and role alignment" },
  { id: "project", label: "Project Analysis", desc: "Classifying tech stacks and identifying key features" },
  { id: "gap", label: "Gap Detection", desc: "Checking missing details & follow-up questions" },
  { id: "plan", label: "Portfolio Planning", desc: "Structuring role-tailored layout & case study order" },
  { id: "content", label: "Content Generation", desc: "Generating Hero, About narrative, and skills" },
  { id: "casestudy", label: "Case Study Writing", desc: "Crafting structured recruiter-ready case studies" },
  { id: "quality", label: "Quality Audit", desc: "Evaluating 0-100 rubric & truthfulness guardrails" },
  { id: "improve", label: "Self-Improvement", desc: "Auto-revising flagged issues (max 3 rounds)" }
];

export default function AgentProgress({ 
  currentStage, 
  progress = 0, 
  logs = [], 
  state, 
  onGoToStudio, 
  onGoToQuestions,
  questionsCount = 0,
  qualityScore = null
}) {
  const isDone = state === "READY" || state === "COMPLETED" || progress >= 100;

  const getStageStatus = (idx) => {
    if (isDone) {
      return "completed";
    }

    const stageIdxMap = {
      "Profile Analysis": 0,
      "Project Analysis": 1,
      "Gap Detection": 2,
      "Clarification": 2,
      "Portfolio Planning": 3,
      "Plan Created": 3,
      "Content Generation": 4,
      "Case Study Writing": 5,
      "Quality Check": 6,
      "Self-Improvement": 7,
      "Finalized": 8,
      "Completed": 8
    };

    const currentIdx = stageIdxMap[currentStage] ?? Math.floor((progress / 100) * 8);

    if (idx < currentIdx) {
      return "completed";
    } else if (idx === currentIdx) {
      return state === "FAILED" ? "failed" : "active";
    } else {
      return "pending";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-subtle-fade text-[#1B1F3B]">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-soft">
        <div className="w-12 h-12 rounded-xl bg-[#6B3074] text-white flex items-center justify-center mx-auto mb-1 shadow-soft">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B1F3B] tracking-tight">
          Autonomous Portfolio Synthesis
        </h2>
        <p className="text-xs sm:text-sm text-[#1B1F3B]/75 max-w-lg mx-auto leading-relaxed">
          The agent is inspecting your experience, structuring technical case studies, and auditing quality against recruiter rubrics.
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mt-6">
          <div className="flex justify-between text-xs font-mono font-medium text-[#1B1F3B]/75 mb-2">
            <span className="text-[#6B3074] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6B3074] animate-pulse" />
              {currentStage || "Processing..."}
            </span>
            <span className="text-[#1B1F3B] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#FAF7F4] rounded-full overflow-hidden border border-[#E5DFD7]">
            <div
              className="h-full bg-[#6B3074] transition-all duration-500 rounded-full shadow-xs"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Action Trigger Banner if state requires user input */}
        {state === "NEEDS_INFO" && (
          <div className="mt-6 p-4 rounded-xl bg-[#FAF7F4] border border-amber-300 text-[#1B1F3B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-soft animate-subtle-fade">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">The agent detected {questionsCount} clarifying questions to improve case studies.</span>
            </div>
            <button
              onClick={onGoToQuestions}
              className="px-4 py-2 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold transition flex items-center space-x-1 shrink-0 shadow-coral"
            >
              <span>Answer Questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isDone && (
          <div className="mt-6 p-4 rounded-xl bg-[#FAF7F4] border border-emerald-300 text-[#1B1F3B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-soft animate-subtle-fade">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-[#1B1F3B] block">Portfolio Ready for Review</span>
                {qualityScore !== null && (
                  <span className="text-[11px] text-[#1B1F3B]/70 font-mono">
                    Quality Audit Score: <strong className="text-emerald-700 font-bold">{qualityScore}/100</strong> &bull; Recruiter-Ready
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onGoToStudio}
              className="px-5 py-2.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold transition flex items-center space-x-1.5 shadow-coral shrink-0"
            >
              <span>Open Portfolio Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {STAGES.map((s, idx) => {
          const status = getStageStatus(idx);
          return (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border transition text-left space-y-1.5 ${
                status === "completed"
                  ? "bg-[#FAF7F4] border-[#E5DFD7] text-[#1B1F3B]"
                  : status === "active"
                  ? "bg-white border-[#6B3074] ring-2 ring-[#6B3074] shadow-soft text-[#1B1F3B]"
                  : "bg-white/60 border-[#E5DFD7] text-[#1B1F3B]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1B1F3B]/60 font-semibold">
                  Stage {idx + 1}
                </span>
                {status === "completed" && <CheckCircle2 className="w-4 h-4 text-[#6B3074]" />}
                {status === "active" && (
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FF6B6B] text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                      Live
                    </span>
                    <Loader2 className="w-3.5 h-3.5 text-[#6B3074] animate-spin" />
                  </div>
                )}
                {status === "pending" && <Circle className="w-3.5 h-3.5 text-[#1B1F3B]/25" />}
              </div>
              <h4 className="text-xs font-bold text-[#1B1F3B]">
                {s.label}
              </h4>
              <p className="text-[11px] text-[#1B1F3B]/70 leading-snug">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Real-time Agent Log Console */}
      <div className="bg-[#FAF7F4] border border-[#E5DFD7] rounded-xl p-4 font-mono text-xs shadow-soft">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5DFD7] text-[#1B1F3B]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-[#6B3074]" />
            <span className="font-bold text-[#1B1F3B]">Agent Event Stream</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Live SSE Stream
          </span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2 text-[#1B1F3B]">
          {logs.length === 0 ? (
            <p className="text-[#1B1F3B]/50 italic">Initializing agent pipeline...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                <span className="text-[#1B1F3B]/40 text-[10px] shrink-0 font-mono">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ">"}
                </span>
                <span className="text-[#6B3074] font-bold shrink-0">[{log.stage}]</span>
                <span className="text-[#1B1F3B]/85 break-words">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
