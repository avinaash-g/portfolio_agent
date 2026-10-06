import React from "react";
import { 
  CheckCircle2, Circle, Loader2, AlertCircle, 
  Terminal, ArrowRight, ShieldCheck, Cpu 
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center mx-auto mb-1">
          <Cpu className="w-5 h-5 text-zinc-800" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Autonomous Portfolio Synthesis
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
          The agent is inspecting your experience, structuring technical case studies, and auditing quality against recruiter rubrics.
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mt-6">
          <div className="flex justify-between text-xs font-mono font-medium text-zinc-500 mb-2">
            <span>{currentStage || "Processing..."}</span>
            <span className="text-zinc-900 font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div
              className="h-full bg-zinc-900 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Action Trigger Banner if state requires user input */}
        {state === "NEEDS_INFO" && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>The agent detected {questionsCount} clarifying questions to improve case studies.</span>
            </div>
            <button
              onClick={onGoToQuestions}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition flex items-center space-x-1 shrink-0"
            >
              <span>Answer Questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isDone && (
          <div className="mt-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-zinc-900 shrink-0" />
              <div className="text-left">
                <span className="font-semibold text-zinc-900 block">Portfolio Ready for Review</span>
                {qualityScore !== null && (
                  <span className="text-[11px] text-zinc-600 font-mono">
                    Quality Audit Score: <strong>{qualityScore}/100</strong> &bull; Recruiter-Ready
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onGoToStudio}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition flex items-center space-x-1.5 shadow-2xs shrink-0"
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
                  ? "bg-zinc-50/70 border-zinc-200 text-zinc-800"
                  : status === "active"
                  ? "bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-2xs text-zinc-900"
                  : "bg-white border-zinc-200/70 text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Stage {idx + 1}
                </span>
                {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900" />}
                {status === "active" && <Loader2 className="w-3.5 h-3.5 text-zinc-900 animate-spin" />}
                {status === "pending" && <Circle className="w-3.5 h-3.5 text-zinc-300" />}
              </div>
              <h4 className="text-xs font-semibold text-zinc-900">
                {s.label}
              </h4>
              <p className="text-[11px] text-zinc-500 leading-snug">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Real-time Agent Log Console */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-xs shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-200 text-zinc-500">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-700" />
            <span className="font-semibold text-zinc-800">Agent Event Stream</span>
          </div>
          <span className="text-[10px] text-zinc-400">Live SSE Stream</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2 text-zinc-700">
          {logs.length === 0 ? (
            <p className="text-zinc-400 italic">Initializing agent pipeline...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                <span className="text-zinc-400 text-[10px] shrink-0 font-mono">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ">"}
                </span>
                <span className="text-zinc-900 font-semibold shrink-0">[{log.stage}]</span>
                <span className="text-zinc-600 break-words">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
