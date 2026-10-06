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
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-zinc-800" />
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Direct Content Editor
          </h4>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition shadow-2xs disabled:opacity-50"
        >
          {savedStatus ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedStatus ? "Saved!" : isSaving ? "Saving..." : "Save Edits"}</span>
        </button>
      </div>

      {/* Section Subtabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 overflow-x-auto text-[11px] font-medium">
        {["hero", "about", "skills", "projects"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
            className={`px-2.5 py-1 rounded-md capitalize transition ${
              activeSection === tab
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
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
            <label className="block text-zinc-700 mb-1 font-medium">Hero Title</label>
            <input
              type="text"
              value={formData.hero?.title || ""}
              onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1 font-medium">Tagline / Value Statement</label>
            <input
              type="text"
              value={formData.hero?.tagline || ""}
              onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, tagline: e.target.value } })}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>
      )}

      {/* About Editor */}
      {activeSection === "about" && (
        <div className="space-y-2 text-xs">
          <label className="block text-zinc-700 font-medium">About Narrative</label>
          <textarea
            rows={5}
            value={formData.about || ""}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 resize-none leading-relaxed"
          />
        </div>
      )}

      {/* Skills Editor */}
      {activeSection === "skills" && (
        <div className="space-y-3 text-xs">
          {Object.entries(formData.skills || {}).map(([category, items]) => (
            <div key={category} className="space-y-1">
              <label className="block text-zinc-800 font-semibold capitalize">{category}</label>
              <input
                type="text"
                value={Array.isArray(items) ? items.join(", ") : items}
                onChange={(e) => {
                  const updatedSkills = { ...formData.skills };
                  updatedSkills[category] = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                  setFormData({ ...formData, skills: updatedSkills });
                }}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
              />
            </div>
          ))}
        </div>
      )}

      {/* Featured Projects Editor */}
      {activeSection === "projects" && (
        <div className="space-y-3 text-xs max-h-64 overflow-y-auto pr-1">
          {formData.featured_projects?.map((proj, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
              <span className="font-semibold text-zinc-900 text-xs block">{proj.name}</span>
              <input
                type="text"
                value={proj.overview || ""}
                onChange={(e) => {
                  const updated = [...formData.featured_projects];
                  updated[idx].overview = e.target.value;
                  setFormData({ ...formData, featured_projects: updated });
                }}
                placeholder="Overview"
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-900 text-xs focus:outline-none focus:border-zinc-900"
              />
              <textarea
                rows={2}
                value={proj.solution || ""}
                onChange={(e) => {
                  const updated = [...formData.featured_projects];
                  updated[idx].solution = e.target.value;
                  setFormData({ ...formData, featured_projects: updated });
                }}
                placeholder="Technical Solution"
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-900 text-xs resize-none focus:outline-none focus:border-zinc-900"
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
