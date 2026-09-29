import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Quote,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { EmailThread } from '../types';
import { summarizeThread, factCheckClaim, FactCheckResponse } from '../services/aiService';

interface AISummaryCardProps {
  thread: EmailThread;
  onUpdateThreadSummary: (threadId: string, newSummary: EmailThread['summary']) => void;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  thread,
  onUpdateThreadSummary,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedClaimForAudit, setSelectedClaimForAudit] = useState<string | null>(null);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const summary = thread.summary;

  const handleRegenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const result = await summarizeThread(thread.subject, thread.messages);
      onUpdateThreadSummary(thread.id, {
        executiveSummary: result.executiveSummary,
        keyTakeaways: result.keyTakeaways,
        deadlines: result.deadlines,
        actionItems: (result.actionItems || []).map((a: any, i: number) => ({
          id: a.id || `act-${Date.now()}-${i}`,
          task: a.task,
          assignee: a.assignee || 'You',
          completed: false,
        })),
        sentiment: result.sentiment || 'neutral',
        verificationQuotes: result.verificationQuotes || [],
      });
    } catch (err) {
      console.error('Failed to regenerate summary:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (!summary) return;
    const updatedTasks = summary.actionItems.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    onUpdateThreadSummary(thread.id, {
      ...summary,
      actionItems: updatedTasks,
    });
  };

  const handleFactCheck = async (claim: string) => {
    setSelectedClaimForAudit(claim);
    setIsAuditing(true);
    setFactCheckResult(null);

    const fullOriginalText = thread.messages.map((m) => `${m.sender}: ${m.body}`).join('\n\n');

    try {
      const result = await factCheckClaim(claim, fullOriginalText);
      setFactCheckResult(result);
    } catch (e) {
      console.error('Fact check error:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  if (!summary) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 text-center my-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Summarize this email thread with AI (Goal 3)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Extract key decisions, deliverables, deadlines, and assign action items in seconds.
            </p>
          </div>
          <button
            onClick={handleRegenerateSummary}
            disabled={isSummarizing}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            {isSummarizing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Thread...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Thread Summary</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-4 my-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100/70 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">AI Thread Summary</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.2 rounded">
                Goal 3
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                  summary.sentiment === 'urgent'
                    ? 'bg-rose-100 text-rose-700'
                    : summary.sentiment === 'positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {summary.sentiment}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRegenerateSummary}
            disabled={isSummarizing}
            title="Re-run AI summarization"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3.5 text-xs text-slate-700">
          {/* Executive Summary */}
          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100/80 leading-relaxed shadow-xs">
            <p className="font-medium text-slate-800">{summary.executiveSummary}</p>
          </div>

          {/* Grid: Deadlines & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Extracted Deadlines */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Extracted Deadlines</span>
              </div>
              {summary.deadlines.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No specific deadlines mentioned.</p>
              ) : (
                <div className="space-y-1.5">
                  {summary.deadlines.map((dl, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 flex items-start justify-between gap-2"
                    >
                      <span className="text-[11px] font-medium text-amber-950">{dl.item}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                          dl.urgency === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {dl.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Items with completion checklist */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Action Items</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {summary.actionItems.filter((a) => a.completed).length}/{summary.actionItems.length} done
                </span>
              </div>

              {summary.actionItems.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No action items detected.</p>
              ) : (
                <div className="space-y-1">
                  {summary.actionItems.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleToggleTask(act.id)}
                      className={`w-full text-left p-1.5 rounded-lg flex items-start gap-2 transition-all ${
                        act.completed
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {act.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] leading-snug">{act.task}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Assigned: {act.assignee}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goal 3 Task 4: Fact-Check & Verification Inspector against original emails */}
          <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fact-Check & Accuracy Inspector (Goal 3 Task 4)</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-medium">
                Verify against raw email
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Click any takeaway below to audit its veracity against original email quotes:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {summary.keyTakeaways.map((takeaway, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFactCheck(takeaway)}
                  className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    selectedClaimForAudit === takeaway
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-indigo-50 border-slate-200'
                  }`}
                >
                  <Quote className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  <span className="truncate max-w-[280px]">{takeaway}</span>
                </button>
              ))}
            </div>

            {/* Audit Result Display */}
            {isAuditing && (
              <div className="p-2.5 bg-white rounded-lg border border-indigo-200 flex items-center gap-2 text-xs text-indigo-600">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing claim against full thread source text...</span>
              </div>
            )}

            {factCheckResult && !isAuditing && (
              <div className="p-3 bg-white rounded-xl border border-indigo-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{factCheckResult.verdict}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Confidence: {factCheckResult.confidenceScore}%
                  </span>
                </div>
                {factCheckResult.matchingQuote && (
                  <div className="p-2 bg-slate-50 border-l-2 border-indigo-500 rounded text-slate-700 text-[11px] italic">
                    "{factCheckResult.matchingQuote}"
                  </div>
                )}
                {factCheckResult.discrepancyNote && (
                  <p className="text-[11px] text-slate-500">{factCheckResult.discrepancyNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
