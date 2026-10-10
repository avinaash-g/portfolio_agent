import React from "react";
import { ListOrdered, ArrowRight, ShieldCheck, Layers } from "lucide-react";

export default function PlanReview({ plan, onApprove, isApproving }) {
  if (!plan) return null;

  const sectionOrder = plan.section_order || [];
  const roleEmphasis = plan.role_emphasis || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-[#1B1F3B]">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-6 sm:p-8 space-y-3 shadow-soft text-center">
        <div className="w-10 h-10 rounded-xl bg-[#6B3074]/15 border border-[#6B3074]/25 text-[#6B3074] flex items-center justify-center mx-auto mb-1">
          <Layers className="w-5 h-5 text-[#6B3074]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B1F3B] tracking-tight">
          Portfolio Architecture Plan
        </h2>
        <p className="text-xs sm:text-sm text-[#1B1F3B]/75 max-w-lg mx-auto leading-relaxed">
          The agent formulated this layout and project hierarchy tailored to your target role: <strong className="text-[#6B3074] font-bold">{plan.target_role}</strong>.
        </p>
      </div>

      {/* Role Strategy Card */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-2 text-xs shadow-soft">
        <span className="font-mono uppercase text-[#1B1F3B]/50 font-bold tracking-wider text-[10px]">
          Target Role Storytelling Strategy
        </span>
        <h4 className="text-sm font-bold text-[#1B1F3B]">{roleEmphasis.primary_focus}</h4>
        <p className="text-[#1B1F3B]/75 leading-relaxed">{roleEmphasis.storyline}</p>
        
        {roleEmphasis.keywords && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {roleEmphasis.keywords.map((kw, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F4] text-[#1B1F3B] border border-[#DCD5CB] font-medium">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section Order */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-3 shadow-soft">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1B1F3B]">
          <ListOrdered className="w-4 h-4 text-[#6B3074]" />
          <span>Planned Section Sequence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sectionOrder.map((sec, idx) => (
            <div
              key={sec}
              className="p-2.5 rounded-lg bg-[#FAF7F4] border border-[#E5DFD7] text-xs flex items-center space-x-2"
            >
              <span className="w-5 h-5 rounded-md bg-white border border-[#DCD5CB] text-[#6B3074] text-[10px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-[#1B1F3B] capitalize font-medium truncate">
                {sec.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-soft">
        <div className="flex items-center space-x-2 text-xs text-[#1B1F3B]/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Empty sections are omitted rather than left blank.</span>
        </div>

        <button
          type="button"
          disabled={isApproving}
          onClick={onApprove}
          className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs transition shadow-coral disabled:opacity-50"
        >
          <span>{isApproving ? "Generating..." : "Approve Plan & Generate"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
