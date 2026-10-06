import React, { useState } from "react";
import { 
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, 
  ChevronDown, ChevronUp, Award 
} from "lucide-react";

export default function QualityScorecard({ qualityReport, onQuickFix }) {
  const [showAllChecklist, setShowAllChecklist] = useState(false);

  if (!qualityReport) {
    return (
      <div className="p-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-500 shadow-2xs">
        Quality scorecard will appear once portfolio generation begins.
      </div>
    );
  }

  const score = qualityReport.score || 0;
  const issues = qualityReport.issues || [];
  const checklist = qualityReport.checklist || {};

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 shadow-2xs">
      
      {/* Top Score Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Recruiter Quality Audit
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <h3 className="text-2xl font-bold text-zinc-900">{score}</h3>
            <span className="text-xs text-zinc-400 font-medium">/ 100</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                score >= 80
                  ? "bg-zinc-100 border-zinc-200 text-zinc-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {score >= 80 ? "Recruiter Ready" : "Optimization Needed"}
            </span>
          </div>
        </div>

        {/* Factual Integrity Badge */}
        <div className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center space-x-1.5 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span className="hidden sm:inline">Zero Fabrications</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
        <div
          className="h-full rounded-full transition-all duration-700 bg-zinc-900"
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {/* Checklist Breakdown */}
      <div className="space-y-2">
        <div 
          onClick={() => setShowAllChecklist(!showAllChecklist)}
          className="flex items-center justify-between text-xs font-semibold text-zinc-800 cursor-pointer hover:text-zinc-950"
        >
          <span>9-Point Evaluation Rubric</span>
          <button className="text-zinc-400">
            {showAllChecklist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className={`space-y-1.5 ${showAllChecklist ? "block" : "hidden sm:block"}`}>
          {Object.entries(checklist).slice(0, showAllChecklist ? 9 : 4).map(([key, item]) => (
            <div
              key={key}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/70 border border-zinc-200/80 text-[11px]"
            >
              <div className="flex items-center space-x-2">
                {item.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span className="text-zinc-700 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
              </div>
              <span className="font-mono text-zinc-500">{item.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Issues List with Severity Tags */}
      {issues.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-200">
          <span className="text-xs font-semibold text-zinc-800">
            Audit Findings ({issues.length})
          </span>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                    {issue.location}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                      issue.severity === "High"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-zinc-100 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p className="text-zinc-700 text-[11px] leading-tight">{issue.description}</p>
                {issue.suggestion && (
                  <p className="text-zinc-900 text-[11px] font-medium leading-tight">
                    &bull; Fix: {issue.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
