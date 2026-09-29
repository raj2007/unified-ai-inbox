import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCw,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Inbox,
  Lightbulb,
} from 'lucide-react';
import { DailyDigestData, EmailThread, EmailAccount } from '../types';
import { generateDailyDigest } from '../services/aiService';

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: EmailThread[];
  accounts: EmailAccount[];
  onSelectThreadById: (threadId: string) => void;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  threads,
  accounts,
  onSelectThreadById,
}) => {
  const [digest, setDigest] = useState<DailyDigestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !digest) {
      loadDigest();
    }
  }, [isOpen]);

  const loadDigest = async () => {
    setIsLoading(true);
    const accountStats = accounts.reduce((acc, a) => {
      acc[a.name] = `${a.unreadCount} unread`;
      return acc;
    }, {} as Record<string, string>);

    try {
      const data = await generateDailyDigest(threads, accountStats);
      setDigest(data);
    } catch (err) {
      console.error('Error generating digest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!digest) return;
    const text = `${digest.greeting}\n\nURGENT ACTIONS:\n${digest.urgentAttention
      .map((u) => `• [${u.account}] ${u.reason} -> ${u.suggestedAction}`)
      .join('\n')}\n\nDEADLINES:\n${digest.upcomingDeadlinesToday
      .map((d) => `• ${d.task} (${d.time})`)
      .join('\n')}\n\nTIP: ${digest.productivityTip}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  Daily Executive Email Digest
                </h2>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  Goal 3 Task 3
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Unified cross-account morning briefing synthesized by Gemini 3.8 Flash.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDigest}
              disabled={isLoading}
              title="Regenerate digest"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-xs">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                Scanning Gmail, Outlook & Work inboxes...
              </p>
              <p className="text-xs text-slate-500">
                Synthesizing high-priority action items and schedule deadlines...
              </p>
            </div>
          ) : digest ? (
            <>
              {/* Greeting Banner */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{digest.greeting}</h3>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Covers 3 connected accounts with real-time urgency classification.
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                    digest.urgencyLevel === 'high'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {digest.urgencyLevel} Attention
                </span>
              </div>

              {/* High Priority Actions Requiring Response */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Requires Attention Today ({digest.urgentAttention.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {digest.urgentAttention.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-rose-700 border border-rose-200">
                          {item.account}
                        </span>
                        {item.emailId && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectThreadById(item.emailId!);
                            }}
                            className="text-[10px] text-rose-700 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <span>Open Thread</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{item.reason}</p>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Action: <strong>{item.suggestedAction}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Upcoming Deliverables & Deadlines</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 divide-y divide-slate-200/60">
                  {digest.upcomingDeadlinesToday.map((dl, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-slate-800 text-xs">{dl.task}</span>
                        <span className="text-[10px] text-slate-400 block">{dl.account}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                        {dl.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account by Account Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <span>Account Breakdown</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {digest.accountBreakdowns.map((acc, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="truncate">{acc.account}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{acc.summary}</p>
                      <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                        {acc.keyCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productivity Tip */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 text-xs">Today's Focus Tip:</span>
                  <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                    {digest.productivityTip}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={!digest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-xs font-medium text-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
