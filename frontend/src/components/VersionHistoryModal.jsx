import React from "react";
import { X, History, RotateCcw } from "lucide-react";

export default function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  versions = [], 
  currentVersionId, 
  onRestoreVersion 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1F3B]/60 backdrop-blur-sm animate-subtle-fade">
      <div className="w-full max-w-xl bg-white border border-[#E5DFD7] rounded-2xl shadow-2xl p-6 space-y-4 text-[#1B1F3B]">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#6B3074]" />
            <h3 className="text-sm font-bold text-[#1B1F3B]">Portfolio Version History</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#1B1F3B]/40 hover:text-[#1B1F3B] hover:bg-[#EAE4DC] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#1B1F3B]/70 leading-relaxed">
          Every generation, manual edit, and natural-language refinement produces an immutable revision snapshot.
        </p>

        {/* Version List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {versions.map((ver) => {
            const isCurrent = ver.id === currentVersionId;
            return (
              <div
                key={ver.id}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
                  isCurrent
                    ? "bg-[#FAF7F4] border-[#6B3074] ring-2 ring-[#6B3074] shadow-soft"
                    : "bg-white border-[#E5DFD7] hover:border-[#DCD5CB]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#1B1F3B]">Version #{ver.version_number}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6B3074] text-white font-bold">
                        Active
                      </span>
                    )}
                    <span className="text-[10px] text-[#1B1F3B]/50 font-mono">
                      {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[#1B1F3B]/75 text-[11px] leading-tight">
                    {ver.change_summary || "Generated revision."}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-[#1B1F3B]/50">
                    <span className="capitalize flex items-center gap-1 text-[#1B1F3B]/70">
                      Source: {ver.created_by}
                    </span>
                    {ver.quality_report?.score && (
                      <span>&bull; Score: <strong className="text-[#6B3074]">{ver.quality_report.score}/100</strong></span>
                    )}
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      onRestoreVersion(ver.id);
                      onClose();
                    }}
                    className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white text-xs font-bold transition shadow-coral"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#E5DFD7]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FAF7F4] text-[#1B1F3B] text-xs font-semibold hover:bg-[#EAE4DC] border border-[#DCD5CB] transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
