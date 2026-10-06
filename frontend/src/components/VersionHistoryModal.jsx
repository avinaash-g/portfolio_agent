import React from "react";
import { X, History, RotateCcw, Sparkles, User, Wand2 } from "lucide-react";

export default function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  versions = [], 
  currentVersionId, 
  onRestoreVersion 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-zinc-800" />
            <h3 className="text-sm font-semibold text-zinc-900">Portfolio Version History</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
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
                    ? "bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900 shadow-2xs"
                    : "bg-white border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-zinc-900">Version #{ver.version_number}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-white font-medium">
                        Active
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400">
                      {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-zinc-600 text-[11px] leading-tight">
                    {ver.change_summary || "Generated revision."}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                    <span className="capitalize flex items-center gap-1 text-zinc-500">
                      Source: {ver.created_by}
                    </span>
                    {ver.quality_report?.score && (
                      <span>&bull; Score: {ver.quality_report.score}/100</span>
                    )}
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      onRestoreVersion(ver.id);
                      onClose();
                    }}
                    className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-medium hover:bg-zinc-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
