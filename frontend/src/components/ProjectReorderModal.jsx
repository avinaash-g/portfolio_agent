import React, { useState } from "react";
import { X, ArrowUp, ArrowDown, Star, Check } from "lucide-react";

export default function ProjectReorderModal({ isOpen, onClose, content, onSaveOrder }) {
  if (!isOpen || !content) return null;

  const [featured, setFeatured] = useState([...(content.featured_projects || [])]);
  const [other, setOther] = useState([...(content.other_projects || [])]);

  const moveUp = (list, setList, idx) => {
    if (idx <= 0) return;
    const updated = [...list];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setList(updated);
  };

  const moveDown = (list, setList, idx) => {
    if (idx >= list.length - 1) return;
    const updated = [...list];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setList(updated);
  };

  const moveToOther = (proj) => {
    setFeatured(featured.filter((p) => p.id !== proj.id));
    setOther([...other, proj]);
  };

  const moveToFeatured = (proj) => {
    setOther(other.filter((p) => p.id !== proj.id));
    setFeatured([...featured, proj]);
  };

  const handleSave = () => {
    onSaveOrder({
      featured_project_ids: featured.map((p) => p.id),
      other_project_ids: other.map((p) => p.id)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 space-y-5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-zinc-800" />
            <h3 className="text-sm font-semibold text-zinc-900">Organize & Feature Projects</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Featured Projects */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-900 uppercase tracking-wide">
              Featured Case Studies ({featured.length})
            </span>
            <span className="text-[11px] text-zinc-500">Recruiters see these highlighted first</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {featured.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-5 h-5 rounded-md bg-white border border-zinc-200 text-zinc-800 font-semibold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-900 font-medium truncate">{p.name}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => moveUp(featured, setFeatured, idx)}
                    disabled={idx === 0}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(featured, setFeatured, idx)}
                    disabled={idx === featured.length - 1}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveToOther(p)}
                    className="ml-2 px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-700 font-medium transition"
                  >
                    Demote to Other
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Projects */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-200">
          <span className="font-semibold text-zinc-700 uppercase tracking-wide text-xs">
            Additional Projects ({other.length})
          </span>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {other.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No additional projects.</p>
            ) : (
              other.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                >
                  <span className="text-zinc-700 truncate">{p.name}</span>
                  <button
                    onClick={() => moveToFeatured(p)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-medium"
                  >
                    Promote to Featured
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition shadow-2xs"
          >
            Save Organization
          </button>
        </div>

      </div>
    </div>
  );
}
