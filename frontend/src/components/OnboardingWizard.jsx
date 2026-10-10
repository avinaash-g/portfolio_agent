import React, { useState } from "react";
import { 
  Sparkles, Plus, Trash2, Globe, Briefcase, 
  GraduationCap, Award, Code2, ArrowRight, Save, Layers, CheckCircle2,
  Palette, AlertTriangle
} from "lucide-react";
import { SAMPLE_PROFILES } from "../utils/sampleData";
import { CURATED_THEMES, PRESET_ACCENT_COLORS, CURATED_LAYOUTS } from "../utils/themeData";

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TARGET_ROLES = [
  "Software Developer",
  "AI Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "UI/UX Designer",
  "Custom"
];

export default function OnboardingWizard({ 
  formData, 
  setFormData, 
  onSaveDraft, 
  onGenerate, 
  isGenerating,
  selectedTheme = "emerald",
  setSelectedTheme,
  accentColor = "#18181b",
  setAccentColor,
  selectedLayout = "modern_grid",
  setSelectedLayout,
  customLayoutPrompt = "",
  setCustomLayoutPrompt,
  agentStatus
}) {
  const [activeTab, setActiveTab] = useState("basics");
  const [customRole, setCustomRole] = useState("");
  const [newSkill, setNewSkill] = useState("");

  // Load a sample profile
  const handleLoadSample = (key) => {
    const sample = SAMPLE_PROFILES[key];
    if (!sample) return;
    setFormData({
      name: sample.name,
      target_role: sample.target_role,
      headline: sample.headline,
      about: sample.about,
      skills: [...sample.skills],
      links: { ...sample.links },
      experience: JSON.parse(JSON.stringify(sample.experience || [])),
      education: JSON.parse(JSON.stringify(sample.education || [])),
      achievements: JSON.parse(JSON.stringify(sample.achievements || [])),
      projects: JSON.parse(JSON.stringify(sample.projects || []))
    });
  };

  // Skill management
  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove)
    });
  };

  // Project management
  const addProject = () => {
    const newProj = {
      name: "New Project",
      description: "",
      technologies: ["React", "TypeScript", "PostgreSQL"],
      role: "Developer",
      github_url: "",
      demo_url: "",
      outcomes: "",
      is_featured: true
    };
    setFormData({ ...formData, projects: [...formData.projects, newProj] });
  };

  const removeProject = (index) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index)
    });
  };

  const updateProject = (index, field, value) => {
    const updated = [...formData.projects];
    updated[index][field] = value;
    setFormData({ ...formData, projects: updated });
  };

  // Experience management
  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [
        ...formData.experience,
        { company: "", role: "", duration: "", description: "" }
      ]
    });
  };

  const removeExperience = (index) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index)
    });
  };

  // Education management
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { institution: "", degree: "", year: "", details: "" }
      ]
    });
  };

  const removeEducation = (index) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-[#1B1F3B]">
      
      {/* Deterministic / Agent Status Banner */}
      {agentStatus && !agentStatus.gemini_configured && (
        <div className="bg-[#FAF7F4] border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs text-[#1B1F3B] shadow-soft">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[#1B1F3B]">Deterministic Fallback Engine Active</div>
            <p className="text-[#1B1F3B]/75 leading-relaxed">
              Operating in verified offline mode with deterministic factual guardrails. For live Gemini LLM multimodal inference, set <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]">GEMINI_API_KEY</code> in <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]">backend/.env</code>.
            </p>
          </div>
        </div>
      )}

      {/* Sample Quick-Loader Banner */}
      <div className="bg-[#FAF7F4] border border-[#E5DFD7] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#6B3074]/15 border border-[#6B3074]/25 text-[#6B3074] flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-4 h-4 text-[#6B3074]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1B1F3B]">Pre-fill Demo Candidate Data</h4>
            <p className="text-xs text-[#1B1F3B]/70">Quickly test the pipeline with curated engineering profiles.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample("software_developer")}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-xs font-semibold text-[#1B1F3B] border border-[#DCD5CB] shadow-xs transition"
          >
            Full-Stack Dev
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample("ai_engineer")}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-xs font-semibold text-[#1B1F3B] border border-[#DCD5CB] shadow-xs transition"
          >
            AI Engineer
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample("sparse_profile")}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] text-xs font-semibold text-[#1B1F3B] border border-[#DCD5CB] shadow-xs transition"
          >
            Sparse (Test Gaps)
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-[#E5DFD7] overflow-x-auto gap-4">
        <button
          onClick={() => setActiveTab("basics")}
          className={`pb-3 px-1 text-xs font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "basics"
              ? "border-[#6B3074] text-[#6B3074] font-bold"
              : "border-transparent text-[#1B1F3B]/60 hover:text-[#1B1F3B]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Profile & Target Role</span>
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-3 px-1 text-xs font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "projects"
              ? "border-[#6B3074] text-[#6B3074] font-bold"
              : "border-transparent text-[#1B1F3B]/60 hover:text-[#1B1F3B]"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>2. Projects ({formData.projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("experience")}
          className={`pb-3 px-1 text-xs font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "experience"
              ? "border-[#6B3074] text-[#6B3074] font-bold"
              : "border-transparent text-[#1B1F3B]/60 hover:text-[#1B1F3B]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>3. Work & Education</span>
        </button>
      </div>

      {/* TAB 1: Profile & Target Role */}
      {activeTab === "basics" && (
        <div className="bg-white border border-[#E5DFD7] rounded-xl p-6 sm:p-8 space-y-6 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
                Full Name <span className="text-[#FF6B6B]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Alex Rivera"
                className="w-full px-3.5 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
              />
            </div>

            {/* Target Role Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
                Target Role <span className="text-[#FF6B6B]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {TARGET_ROLES.map((role) => {
                  const isActive = formData.target_role === role || (role === "Custom" && !TARGET_ROLES.slice(0, -1).includes(formData.target_role));
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        if (role === "Custom") {
                          setFormData({ ...formData, target_role: customRole || "Custom Engineer" });
                        } else {
                          setFormData({ ...formData, target_role: role });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center border transition ${
                        isActive
                          ? "bg-[#6B3074] text-white border-[#6B3074] shadow-soft font-bold"
                          : "bg-[#F3EFEA] border-[#DCD5CB] text-[#1B1F3B] hover:bg-[#EAE4DC]"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
              {!TARGET_ROLES.slice(0, -1).includes(formData.target_role) && (
                <input
                  type="text"
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                  placeholder="Enter custom role title..."
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              )}
            </div>

          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
              Professional Headline
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g. Software Engineer specializing in scalable APIs and distributed systems"
              className="w-full px-3.5 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
            />
          </div>

          {/* About / Bio */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
              About / Professional Summary
            </label>
            <textarea
              rows={4}
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Tell recruiters about your background, engineering passions, and architecture approach..."
              className="w-full px-3.5 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition resize-none leading-relaxed"
            />
          </div>

          {/* Skills Input */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
              Skills & Tech Stack
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Type skill & press Enter (e.g. Python, React, PostgreSQL)..."
                className="flex-1 px-3.5 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 rounded-lg bg-[#6B3074] hover:bg-[#5E1B89] text-white text-xs font-semibold shadow-soft transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF7F4] border border-[#DCD5CB] text-xs text-[#1B1F3B] font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-[#1B1F3B]/50 hover:text-rose-600 ml-0.5 text-sm"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B] mb-1.5">
              Contact & Links
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
                <input
                  type="email"
                  value={formData.links?.email || ""}
                  onChange={(e) => setFormData({ ...formData, links: { ...formData.links, email: e.target.value } })}
                  placeholder="Email address"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              </div>
              <div className="relative">
                <GithubIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
                <input
                  type="url"
                  value={formData.links?.github || ""}
                  onChange={(e) => setFormData({ ...formData, links: { ...formData.links, github: e.target.value } })}
                  placeholder="GitHub profile URL"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              </div>
              <div className="relative">
                <LinkedinIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
                <input
                  type="url"
                  value={formData.links?.linkedin || ""}
                  onChange={(e) => setFormData({ ...formData, links: { ...formData.links, linkedin: e.target.value } })}
                  placeholder="LinkedIn profile URL"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              </div>
            </div>
          </div>

          {/* Layout Architecture Selection */}
          <div className="pt-6 border-t border-[#E5DFD7] space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-[#1B1F3B]">
                  Portfolio Layout Architecture
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF7F4] text-[#6B3074] border border-[#6B3074]/20 font-bold">
                  Curated & Custom Modes
                </span>
              </div>
              <p className="text-xs text-[#1B1F3B]/70 mt-0.5">
                Choose a curated structural architecture or describe custom layout rules in natural language.
              </p>
            </div>

            {/* Option 1: Choose Curated Layout Architecture */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#1B1F3B]/70 uppercase tracking-wider block">
                1. Choose Curated Layout Architecture
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CURATED_LAYOUTS.map((lay) => {
                  const isSelected = selectedLayout === lay.id;
                  return (
                    <div
                      key={lay.id}
                      onClick={() => setSelectedLayout && setSelectedLayout(lay.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-white text-[#1B1F3B] border-[#6B3074] shadow-soft ring-2 ring-[#6B3074]"
                          : "bg-[#FAF7F4] border-[#E5DFD7] text-[#1B1F3B] hover:bg-white hover:border-[#6B3074]/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isSelected ? "bg-[#6B3074]/10 text-[#6B3074] border-[#6B3074]/20" : "bg-white text-[#1B1F3B]/75 border-[#DCD5CB]"
                          }`}>
                            {lay.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#6B3074] shrink-0" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#1B1F3B]">
                          {lay.name}
                        </div>
                        <p className="text-[11px] leading-relaxed mt-1 text-[#1B1F3B]/75">
                          {lay.description}
                        </p>
                      </div>
                      <div className="text-[10px] font-mono mt-2.5 pt-1.5 border-t border-[#E5DFD7] text-[#1B1F3B]/50">
                        Best for: {lay.recommendedFor}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Option 2: Describe Custom Layout (Natural Language) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#1B1F3B]/70 uppercase tracking-wider">
                  2. Describe Custom Layout (Natural Language)
                </span>
                <span className="text-[10px] font-mono text-[#6B3074] font-semibold">Agent Planning Interpreted</span>
              </div>
              <textarea
                rows={2}
                value={customLayoutPrompt}
                onChange={(e) => setCustomLayoutPrompt && setCustomLayoutPrompt(e.target.value)}
                placeholder="Describe your preferred layout (e.g., 'Put featured projects right under the hero before skills, and format case studies as compact cards with expandable details')..."
                className="w-full px-3.5 py-2 bg-white border border-[#DCD5CB] rounded-xl text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition resize-none leading-relaxed"
              />
              <p className="text-[11px] text-[#1B1F3B]/60 leading-relaxed">
                The Planning Agent will interpret this instruction and dynamically arrange <code className="px-1 py-0.5 rounded bg-[#FAF7F4] text-[#6B3074] font-mono text-[10px]">section_order</code> and container structures accordingly.
              </p>
            </div>
          </div>

          {/* Visual Personality & Editorial Themes */}
          <div className="pt-6 border-t border-[#E5DFD7] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1B1F3B]">
                  Visual Personality & Palette
                </label>
                <p className="text-xs text-[#1B1F3B]/70">
                  Clean, editorial presets designed for high recruiter impact.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#1B1F3B]/60 font-medium">Selected:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FAF7F4] text-[#1B1F3B] flex items-center gap-1.5 border border-[#DCD5CB]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor || "#18181b" }}></span>
                  <span className="capitalize">{selectedTheme}</span>
                </span>
              </div>
            </div>

            {/* Curated Theme Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {CURATED_THEMES.map((th) => (
                <div
                  key={th.id}
                  onClick={() => {
                    if (setSelectedTheme) setSelectedTheme(th.id);
                    if (setAccentColor) setAccentColor(th.primary);
                  }}
                  className={`cursor-pointer rounded-xl p-3 border transition text-left space-y-1.5 ${
                    selectedTheme === th.id
                      ? "bg-white border-[#6B3074] shadow-soft ring-2 ring-[#6B3074]"
                      : "bg-[#FAF7F4] border-[#E5DFD7] hover:border-[#6B3074]/40 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B1F3B]">{th.name}</span>
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: th.primary }}></span>
                  </div>
                  <span className="text-[11px] text-[#1B1F3B]/70 block">{th.tagline}</span>
                </div>
              ))}
            </div>

            {/* Custom Accent Color Picker */}
            <div className="bg-[#FAF7F4] border border-[#E5DFD7] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#6B3074]" />
                <span className="text-xs font-bold text-[#1B1F3B]">Custom Accent:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor || "#18181b"}
                    onChange={(e) => setAccentColor && setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded-md bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor || "#18181b"}
                    onChange={(e) => setAccentColor && setAccentColor(e.target.value)}
                    placeholder="#18181b"
                    className="w-20 px-2 py-0.5 bg-white border border-[#DCD5CB] rounded text-[#1B1F3B] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Swatch chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor && setAccentColor(color)}
                    className="w-4 h-4 rounded-full border border-white hover:scale-110 transition shadow-xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Projects Manager */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1B1F3B]">Project Showcase</h3>
              <p className="text-xs text-[#1B1F3B]/70">The agent synthesizes these into structured, verified recruiter case studies.</p>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#6B3074] hover:bg-[#5E1B89] text-white font-semibold text-xs transition shadow-soft"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {formData.projects.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E5DFD7] rounded-xl p-8">
              <Code2 className="w-8 h-8 text-[#1B1F3B]/40 mx-auto mb-2" />
              <p className="text-sm text-[#1B1F3B]/70">No projects added yet.</p>
              <button
                type="button"
                onClick={addProject}
                className="mt-3 text-xs text-[#6B3074] font-bold hover:underline"
              >
                + Add your first project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5DFD7] rounded-xl p-5 transition space-y-3.5 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-md bg-[#FAF7F4] border border-[#E5DFD7] text-[#6B3074] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => updateProject(idx, "name", e.target.value)}
                        placeholder="Project Name"
                        className="bg-transparent text-sm font-bold text-[#1B1F3B] focus:outline-none border-b border-transparent focus:border-[#6B3074]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="p-1 text-[#1B1F3B]/40 hover:text-rose-600 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#1B1F3B]/75 mb-1">
                        Your Role on this Project
                      </label>
                      <input
                        type="text"
                        value={proj.role || ""}
                        onChange={(e) => updateProject(idx, "role", e.target.value)}
                        placeholder="e.g. Lead Backend Architect"
                        className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#1B1F3B]/75 mb-1">
                        Technologies (comma separated)
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies}
                        onChange={(e) => updateProject(idx, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                        placeholder="e.g. React, Node.js, PostgreSQL"
                        className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1B1F3B]/75 mb-1">
                      Project Description & Outcomes
                    </label>
                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={(e) => updateProject(idx, "description", e.target.value)}
                      placeholder="Explain what the system does, architectural decisions, and key business outcomes..."
                      className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <GithubIcon className="absolute left-3 top-2 w-3.5 h-3.5 text-[#1B1F3B]/40" />
                      <input
                        type="url"
                        value={proj.github_url || ""}
                        onChange={(e) => updateProject(idx, "github_url", e.target.value)}
                        placeholder="GitHub Repository URL"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2 w-3.5 h-3.5 text-[#1B1F3B]/40" />
                      <input
                        type="url"
                        value={proj.demo_url || ""}
                        onChange={(e) => updateProject(idx, "demo_url", e.target.value)}
                        placeholder="Live Demo URL"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Experience & Education */}
      {activeTab === "experience" && (
        <div className="space-y-4">
          {/* Work Experience */}
          <div className="bg-white border border-[#E5DFD7] rounded-xl p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#1B1F3B]">Work Experience</h4>
                <p className="text-xs text-[#1B1F3B]/70">Employment, internships, or contracts.</p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-1.5 rounded-lg bg-[#6B3074] hover:bg-[#5E1B89] text-xs font-semibold text-white transition shadow-soft"
              >
                + Add Experience
              </button>
            </div>

            {formData.experience.map((exp, idx) => (
              <div key={idx} className="bg-[#FAF7F4] border border-[#E5DFD7] rounded-lg p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#1B1F3B]">Role #{idx + 1}</span>
                  <button type="button" onClick={() => removeExperience(idx)} className="text-[#1B1F3B]/40 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx].company = e.target.value;
                      setFormData({ ...formData, experience: updated });
                    }}
                    placeholder="Company Name"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx].role = e.target.value;
                      setFormData({ ...formData, experience: updated });
                    }}
                    placeholder="Role Title"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => {
                      const updated = [...formData.experience];
                      updated[idx].duration = e.target.value;
                      setFormData({ ...formData, experience: updated });
                    }}
                    placeholder="Duration (e.g. 2023 - Present)"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="bg-white border border-[#E5DFD7] rounded-xl p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#1B1F3B]">Education</h4>
                <p className="text-xs text-[#1B1F3B]/70">Degree, institutions, and academic background.</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="px-3 py-1.5 rounded-lg bg-[#6B3074] hover:bg-[#5E1B89] text-xs font-semibold text-white transition shadow-soft"
              >
                + Add Education
              </button>
            </div>

            {formData.education.map((edu, idx) => (
              <div key={idx} className="bg-[#FAF7F4] border border-[#E5DFD7] rounded-lg p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#1B1F3B]">Education #{idx + 1}</span>
                  <button type="button" onClick={() => removeEducation(idx)} className="text-[#1B1F3B]/40 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].institution = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    placeholder="Institution"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].degree = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    placeholder="Degree (e.g. B.S. in Computer Science)"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].year = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    placeholder="Graduation Year (e.g. 2024)"
                    className="px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074]"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white border-2 border-[#FF6B6B] hover:bg-[#FF6B6B] text-[#FF6B6B] hover:text-white text-xs font-semibold transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile Draft</span>
          </button>
        </div>

        <button
          type="button"
          disabled={isGenerating || !formData.name || !formData.target_role}
          onClick={onGenerate}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs transition shadow-coral disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? "Agent Pipeline Running..." : "Generate Role-Tailored Portfolio"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
