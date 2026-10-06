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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-3 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center mx-auto mb-1">
          <HelpCircle className="w-5 h-5 text-zinc-800" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight text-center">
          Project Information Gaps
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 text-center max-w-lg mx-auto leading-relaxed">
          The agent noticed missing details in your provided projects. Providing these ensures your case studies contain verified metrics and architectural depth.
        </p>
        <div className="pt-2 text-[11px] text-zinc-400 text-center">
          <span className="font-medium text-zinc-700">Factual Integrity:</span> Skipped questions are omitted rather than filled with generic assertions.
        </div>
      </div>

      {/* Blocking Questions Section */}
      {blockingQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-zinc-900 text-xs font-semibold uppercase tracking-wider">
            <AlertOctagon className="w-3.5 h-3.5 text-zinc-700" />
            <span>Essential Technical Details ({blockingQuestions.length})</span>
          </div>

          <div className="space-y-3">
            {blockingQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800">
                    Project: {q.target}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium border border-zinc-200">
                    Recommended
                  </span>
                </div>
                <h4 className="text-xs font-medium text-zinc-900">{q.question}</h4>
                <textarea
                  rows={2}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || "Enter technical details..."}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Questions Section */}
      {optionalQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-zinc-700 text-xs font-semibold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>Optional Clarifications ({optionalQuestions.length})</span>
          </div>

          <div className="space-y-3">
            {optionalQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700">
                    Project: {q.target}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium border border-zinc-200">
                    Optional
                  </span>
                </div>
                <h4 className="text-xs font-medium text-zinc-800">{q.question}</h4>
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || "Enter details or leave blank..."}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium border border-zinc-200 transition"
        >
          <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
          <span>Skip All & Generate Anyway</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit(false)}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition shadow-2xs disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSubmitting ? "Submitting Answers..." : "Submit Answers & Continue"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
