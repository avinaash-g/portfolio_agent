import React from "react";
import { ListOrdered, ArrowRight, ShieldCheck, Layers } from "lucide-react";

export default function PlanReview({ plan, onApprove, isApproving }) {
  if (!plan) return null;

  const sectionOrder = plan.section_order || [];
  const roleEmphasis = plan.role_emphasis || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-3 shadow-2xs text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center mx-auto mb-1">
          <Layers className="w-5 h-5 text-zinc-800" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Portfolio Architecture Plan
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
          The agent formulated this layout and project hierarchy tailored to your target role: <strong className="text-zinc-900">{plan.target_role}</strong>.
        </p>
      </div>

      {/* Role Strategy Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2 text-xs shadow-2xs">
        <span className="font-mono uppercase text-zinc-400 font-semibold tracking-wider text-[10px]">
          Target Role Storytelling Strategy
        </span>
        <h4 className="text-sm font-semibold text-zinc-900">{roleEmphasis.primary_focus}</h4>
        <p className="text-zinc-600 leading-relaxed">{roleEmphasis.storyline}</p>
        
        {roleEmphasis.keywords && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {roleEmphasis.keywords.map((kw, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-50 text-zinc-800 border border-zinc-200">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section Order */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-800">
          <ListOrdered className="w-4 h-4 text-zinc-700" />
          <span>Planned Section Sequence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sectionOrder.map((sec, idx) => (
            <div
              key={sec}
              className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center space-x-2"
            >
              <span className="w-5 h-5 rounded-md bg-white border border-zinc-200 text-zinc-800 text-[10px] font-semibold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-zinc-700 capitalize font-medium truncate">
                {sec.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-zinc-600" />
          <span>Empty sections are omitted rather than left blank.</span>
        </div>

        <button
          type="button"
          disabled={isApproving}
          onClick={onApprove}
          className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition shadow-2xs disabled:opacity-50"
        >
          <span>{isApproving ? "Generating..." : "Approve Plan & Generate"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
