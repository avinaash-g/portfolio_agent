import React, { useState } from "react";
import { X, ArrowUp, ArrowDown, Star } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1F3B]/60 backdrop-blur-sm animate-subtle-fade">
      <div className="w-full max-w-2xl bg-white border border-[#E5DFD7] rounded-2xl shadow-2xl p-6 space-y-5 text-[#1B1F3B]">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-[#6B3074]" />
            <h3 className="text-sm font-bold text-[#1B1F3B]">Organize & Feature Projects</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#1B1F3B]/40 hover:text-[#1B1F3B] hover:bg-[#EAE4DC] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Featured Projects */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1B1F3B] uppercase tracking-wide">
              Featured Case Studies ({featured.length})
            </span>
            <span className="text-[11px] text-[#1B1F3B]/60">Recruiters see these highlighted first</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {featured.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F4] border border-[#E5DFD7] text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-5 h-5 rounded-md bg-white border border-[#DCD5CB] text-[#6B3074] font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[#1B1F3B] font-semibold truncate">{p.name}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => moveUp(featured, setFeatured, idx)}
                    disabled={idx === 0}
                    className="p-1 rounded text-[#1B1F3B]/50 hover:text-[#1B1F3B] disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(featured, setFeatured, idx)}
                    disabled={idx === featured.length - 1}
                    className="p-1 rounded text-[#1B1F3B]/50 hover:text-[#1B1F3B] disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveToOther(p)}
                    className="ml-2 px-2 py-0.5 rounded bg-white hover:bg-[#EAE4DC] border border-[#DCD5CB] text-[10px] text-[#1B1F3B] font-medium transition shadow-xs"
                  >
                    Demote to Other
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Projects */}
        <div className="space-y-2.5 pt-2 border-t border-[#E5DFD7]">
          <span className="font-bold text-[#1B1F3B]/70 uppercase tracking-wide text-xs">
            Additional Projects ({other.length})
          </span>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {other.length === 0 ? (
              <p className="text-xs text-[#1B1F3B]/40 italic">No additional projects.</p>
            ) : (
              other.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F4] border border-[#E5DFD7] text-xs"
                >
                  <span className="text-[#1B1F3B] truncate font-medium">{p.name}</span>
                  <button
                    onClick={() => moveToFeatured(p)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-[#EAE4DC] border border-[#DCD5CB] text-[#1B1F3B] text-[10px] font-medium shadow-xs"
                  >
                    Promote to Featured
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5DFD7]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#DCD5CB] text-[#1B1F3B] text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white text-xs font-bold transition shadow-coral"
          >
            Save Organization
          </button>
        </div>

      </div>
    </div>
  );
}
