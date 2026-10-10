import React, { useState } from "react";
import { Send, Sparkles, Wand2, Check, RefreshCw } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Make project descriptions shorter & punchier",
  "Focus more on backend development & APIs",
  "Emphasize AI, LLMs and model architecture",
  "Tone down adjectives and buzzwords in About"
];

export default function NLEditBox({ onApplyEdit, isEditing, lastEditSummary }) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!instruction.trim() || isEditing) return;
    onApplyEdit(instruction.trim());
    setInstruction("");
  };

  const handleChipClick = (promptText) => {
    if (isEditing) return;
    onApplyEdit(promptText);
  };

  return (
    <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-3.5 shadow-soft text-[#1B1F3B]">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#6B3074]/15 border border-[#6B3074]/25 text-[#6B3074] flex items-center justify-center font-bold">
          <Wand2 className="w-4 h-4 text-[#6B3074]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1B1F3B]">
            Natural-Language Refinement
          </h4>
          <p className="text-[11px] text-[#1B1F3B]/70">
            Instruct the agent in plain English to adjust tone, emphasis, or phrasing.
          </p>
        </div>
      </div>

      {/* Suggested Quick Chips */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isEditing}
            onClick={() => handleChipClick(prompt)}
            className="px-2.5 py-1 rounded-md bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#DCD5CB] text-[11px] font-medium text-[#1B1F3B] transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-[#6B3074] shrink-0" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Focus more on backend scalability & throughput metrics..."
          disabled={isEditing}
          className="w-full pl-3.5 pr-11 py-2 bg-white border border-[#DCD5CB] rounded-lg text-xs text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isEditing || !instruction.trim()}
          className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-[#FF6B6B] hover:bg-[#FA5252] text-white transition disabled:opacity-40 shadow-xs"
        >
          {isEditing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>

      {/* Last Change Feedback */}
      {lastEditSummary && (
        <div className="p-2.5 rounded-lg bg-[#FAF7F4] border border-[#E5DFD7] text-[#1B1F3B] text-xs flex items-start space-x-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-bold text-[#1B1F3B]">Applied: </span>
            <span className="text-[#1B1F3B]/80">{lastEditSummary}</span>
          </div>
        </div>
      )}

    </div>
  );
}
