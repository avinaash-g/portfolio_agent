import React, { useState } from "react";
import { HelpCircle, AlertOctagon, Info, ArrowRight, SkipForward, Sparkles } from "lucide-react";

export default function FollowUpQuestions({ 
  questions = [], 
  onSubmitAnswers, 
  isSubmitting 
}) {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = (generateAnyway = false) => {
    const payload = questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id]?.trim() || null,
      action: !answers[q.id]?.trim() ? "skip" : "answer"
    }));
    onSubmitAnswers(payload, generateAnyway);
  };

  const blockingQuestions = questions.filter((q) => q.severity === "blocking");
  const optionalQuestions = questions.filter((q) => q.severity !== "blocking");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-[#1B1F3B]">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-6 sm:p-8 space-y-3 shadow-soft text-center">
        <div className="w-10 h-10 rounded-xl bg-[#6B3074]/15 border border-[#6B3074]/25 text-[#6B3074] flex items-center justify-center mx-auto mb-1">
          <HelpCircle className="w-5 h-5 text-[#6B3074]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B1F3B] tracking-tight">
          Project Information Gaps
        </h2>
        <p className="text-xs sm:text-sm text-[#1B1F3B]/75 max-w-lg mx-auto leading-relaxed">
          The agent noticed missing details in your provided projects. Providing these ensures your case studies contain verified metrics and architectural depth.
        </p>
        <div className="pt-2 text-[11px] text-[#1B1F3B]/50">
          <span className="font-bold text-[#1B1F3B]">Factual Integrity:</span> Skipped questions are omitted rather than filled with generic assertions.
        </div>
      </div>

      {/* Blocking Questions Section */}
      {blockingQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#1B1F3B] text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-3.5 h-3.5 text-[#FF6B6B]" />
            <span>Essential Technical Details ({blockingQuestions.length})</span>
          </div>

          <div className="space-y-3">
            {blockingQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-2.5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B1F3B]">
                    Project: {q.target}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#6B3074]/10 text-[#6B3074] font-bold border border-[#6B3074]/20">
                    Recommended
                  </span>
                </div>
                <h4 className="text-xs font-medium text-[#1B1F3B]">{q.question}</h4>
                <textarea
                  rows={2}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || "Enter technical details..."}
                  className="w-full px-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] resize-none transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Questions Section */}
      {optionalQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#1B1F3B]/70 text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-[#6B3074]" />
            <span>Optional Clarifications ({optionalQuestions.length})</span>
          </div>

          <div className="space-y-3">
            {optionalQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-2.5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B1F3B]">
                    Project: {q.target}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F4] text-[#1B1F3B]/70 font-medium border border-[#DCD5CB]">
                    Optional
                  </span>
                </div>
                <h4 className="text-xs font-medium text-[#1B1F3B]">{q.question}</h4>
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || "Enter details or leave blank..."}
                  className="w-full px-3 py-1.5 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-none focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white border border-[#E5DFD7] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#FAF7F4] hover:bg-[#EAE4DC] text-[#1B1F3B] text-xs font-semibold border border-[#DCD5CB] transition shadow-xs"
        >
          <SkipForward className="w-3.5 h-3.5 text-[#1B1F3B]/60" />
          <span>Skip All & Generate Anyway</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit(false)}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-xs transition shadow-coral disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>{isSubmitting ? "Submitting Answers..." : "Submit Answers & Continue"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

    </div>
  );
}
