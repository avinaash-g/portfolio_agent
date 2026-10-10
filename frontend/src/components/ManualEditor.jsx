import React, { useState, useEffect } from "react";
import { Edit3, Save, Check } from "lucide-react";

export default function ManualEditor({ content, onSaveManual, isSaving }) {
  const [activeSection, setActiveSection] = useState("hero");
  const [formData, setFormData] = useState(content ? JSON.parse(JSON.stringify(content)) : null);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData(JSON.parse(JSON.stringify(content)));
    }
  }, [content]);

  if (!formData) return null;

  const handleSave = async () => {
    await onSaveManual(formData);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  return (
    <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-4 shadow-soft text-[#1B1F3B]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-[#6B3074]" />
          <h4 className="text-xs font-bold text-[#1B1F3B] uppercase tracking-wider">
            Direct Content Editor
          </h4>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold text-xs transition shadow-coral disabled:opacity-50"
        >
          {savedStatus ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedStatus ? "Saved!" : isSaving ? "Saving..." : "Save Edits"}</span>
        </button>
      </div>

      {/* Section Subtabs */}
      <div className="flex gap-1 bg-[#FAF7F4] p-1 rounded-lg border border-[#E5DFD7] overflow-x-auto text-[11px] font-medium">
        {["hero", "about", "skills", "projects"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
            className={`px-3 py-1 rounded-md capitalize transition ${
              activeSection === tab
                ? "bg-[#6B3074] text-white shadow-xs font-bold"
                : "text-[#1B1F3B]/70 hover:text-[#1B1F3B]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Hero Editor */}
      {activeSection === "hero" && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[#1B1F3B] mb-1 font-bold">Hero Title</label>
            <input
              type="text"
              value={formData.hero?.title || ""}
              onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })}
              className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-none focus:border-[#6B3074]"
            />
          </div>
          <div>
            <label className="block text-[#1B1F3B] mb-1 font-bold">Tagline / Value Statement</label>
            <input
              type="text"
              value={formData.hero?.tagline || ""}
              onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, tagline: e.target.value } })}
              className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-none focus:border-[#6B3074]"
            />
          </div>
        </div>
      )}

      {/* About Editor */}
      {activeSection === "about" && (
        <div className="space-y-2 text-xs">
          <label className="block text-[#1B1F3B] font-bold">About Narrative</label>
          <textarea
            rows={5}
            value={formData.about || ""}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-none focus:border-[#6B3074] resize-none leading-relaxed"
          />
        </div>
      )}

      {/* Skills Editor */}
      {activeSection === "skills" && (
        <div className="space-y-2 text-xs">
          <label className="block text-[#1B1F3B] font-bold">Skills List (comma-separated)</label>
          <input
            type="text"
            value={Array.isArray(formData.skills) ? formData.skills.join(", ") : formData.skills || ""}
            onChange={(e) => {
              const splitted = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              setFormData({ ...formData, skills: splitted });
            }}
            className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-none focus:border-[#6B3074]"
          />
        </div>
      )}

      {/* Projects Editor */}
      {activeSection === "projects" && (
        <div className="space-y-3 text-xs max-h-64 overflow-y-auto pr-1">
          {((formData.featured_projects || []).concat(formData.other_projects || [])).map((proj, idx) => (
            <div key={proj.id || idx} className="p-3 bg-[#FAF7F4] border border-[#E5DFD7] rounded-lg space-y-2">
              <span className="font-bold text-[#1B1F3B] text-[11px]">Project: {proj.name}</span>
              <input
                type="text"
                value={proj.headline || proj.name || ""}
                onChange={(e) => {
                  const updated = JSON.parse(JSON.stringify(formData));
                  const allProjects = [...(updated.featured_projects || []), ...(updated.other_projects || [])];
                  const target = allProjects.find((p) => p.id === proj.id) || allProjects[idx];
                  if (target) target.headline = e.target.value;
                  setFormData(updated);
                }}
                placeholder="Headline"
                className="w-full px-2.5 py-1 bg-white border border-[#DCD5CB] rounded text-[11px] text-[#1B1F3B]"
              />
              <textarea
                rows={2}
                value={proj.outcomes || proj.description || ""}
                onChange={(e) => {
                  const updated = JSON.parse(JSON.stringify(formData));
                  const allProjects = [...(updated.featured_projects || []), ...(updated.other_projects || [])];
                  const target = allProjects.find((p) => p.id === proj.id) || allProjects[idx];
                  if (target) target.outcomes = e.target.value;
                  setFormData(updated);
                }}
                placeholder="Key outcomes..."
                className="w-full px-2.5 py-1 bg-white border border-[#DCD5CB] rounded text-[11px] text-[#1B1F3B] resize-none"
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
