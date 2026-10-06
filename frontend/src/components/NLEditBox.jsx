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
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3.5 shadow-2xs">
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center">
          <Wand2 className="w-3.5 h-3.5 text-zinc-800" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-900">
            Natural-Language Refinement
          </h4>
          <p className="text-[11px] text-zinc-500">
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
            className="px-2.5 py-1 rounded-md bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-zinc-400 shrink-0" />
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
          className="w-full pl-3.5 pr-11 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isEditing || !instruction.trim()}
          className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white transition disabled:opacity-40"
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
        <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs flex items-start space-x-2">
          <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-semibold text-zinc-900">Applied: </span>
            <span className="text-zinc-700">{lastEditSummary}</span>
          </div>
        </div>
      )}

    </div>
  );
}
