import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Wand2,
  FileCheck2,
  Sliders,
  Check,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Flame,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';
import { EmailThread, ReviewResult, PromptTemplate } from '../types';
import { PROMPT_TEMPLATES, TONE_OPTIONS } from '../data/mockEmails';
import { generateEmailDraft, reviewEmailDraft } from '../services/aiService';

interface AIAssistantDrawerProps {
  thread?: EmailThread | null;
  onSendReply: (body: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  thread,
  onSendReply,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'review' | 'templates'>('draft');

  // Drafting inputs
  const [briefNotes, setBriefNotes] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Current draft working text
  const [draftContent, setDraftContent] = useState('');

  // Review states
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick reply options based on context
  const quickReplies = [
    { label: 'Confirm & Accept Deadline', note: 'I have reviewed the timeline and confirm everything will be ready as requested by the deadline.' },
    { label: 'Request Audited Numbers', note: 'Please provide the audited metrics and confirmation on the dataset before we finalize.' },
    { label: 'Propose Alternate Time', note: 'Due to prior commitments, could we push the review by 2 hours or reschedule for tomorrow morning?' },
    { label: 'Acknowledge Receipt', note: 'Thank you for sending this over. I am reviewing the details now and will get back to you shortly.' },
  ];

  const handleGenerate = async () => {
    if (!briefNotes.trim()) return;
    setIsGenerating(true);
    setReviewResult(null);

    const latestMessage = thread?.messages[thread.messages.length - 1];
    const recipient = latestMessage?.sender?.split('(')[0]?.trim() || 'Team';

    try {
      const response = await generateEmailDraft({
        briefNotes,
        tone: selectedTone,
        length: selectedLength,
        recipientName: recipient,
        subject: thread?.subject || '',
        contextThread: latestMessage?.body || '',
      });

      setDraftContent(response.draft);
      setActiveTab('draft');
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewDraft = async () => {
    if (!draftContent.trim()) return;
    setIsReviewing(true);
    try {
      const res = await reviewEmailDraft(draftContent, selectedTone);
      setReviewResult(res);
      setActiveTab('review');
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApplyPolishedVersion = () => {
    if (reviewResult?.improvedDraft) {
      setDraftContent(reviewResult.improvedDraft);
      setActiveTab('draft');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setBriefNotes(template.briefPrompt);
    setActiveTab('draft');
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border-t md:border-t-0 md:border-l border-slate-200 w-full md:w-96 flex flex-col h-full shrink-0 select-none shadow-lg z-20">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">AI Email Assistant</h3>
            <span className="text-[10px] text-purple-700 font-medium">Goal 2 Copilot</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white text-xs font-medium">
        <button
          onClick={() => setActiveTab('draft')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'draft'
              ? 'border-purple-600 text-purple-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Draft & Reply</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'review'
              ? 'border-purple-600 text-purple-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Review & Polish</span>
          {reviewResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'templates'
              ? 'border-purple-600 text-purple-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* TAB 1: DRAFT & REPLY */}
        {activeTab === 'draft' && (
          <div className="space-y-3">
            {/* Quick Context Chips */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Quick Situations (Goal 2 Task 1)
              </label>
              <div className="flex flex-wrap gap-1">
                {quickReplies.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setBriefNotes(q.note)}
                    className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 px-2 py-1 rounded-md text-slate-700 transition-colors text-left"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brief instructions input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Brief Instructions / Quick Notes:
                </label>
                <span className="text-[10px] text-slate-400">Goal 2 Task 3</span>
              </div>
              <textarea
                value={briefNotes}
                onChange={(e) => setBriefNotes(e.target.value)}
                placeholder="e.g. Confirm we are on track for Friday 3 PM, ask Dave for the revenue spreadsheet, board slides almost done..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-xs transition-colors"
              />
            </div>

            {/* Tone & Length Controls */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                  Tone Instruction
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                  Target Length
                </label>
                <select
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value as any)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                >
                  <option value="short">Short (2-3 sentences)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="detailed">Detailed (Full breakdown)</option>
                </select>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !briefNotes.trim()}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Draft with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Polished Email</span>
                </>
              )}
            </button>

            {/* Generated / Editable Draft */}
            {draftContent && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">
                    Generated Draft (Editable):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Copy text"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleReviewDraft}
                      disabled={isReviewing}
                      className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold px-2 py-0.5 rounded border border-purple-200"
                    >
                      {isReviewing ? 'Analyzing...' : 'Audit & Polish'}
                    </button>
                  </div>
                </div>

                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={8}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed outline-none focus:border-purple-500 font-sans"
                />

                {/* Send Reply Button */}
                <button
                  onClick={() => {
                    onSendReply(draftContent);
                    setDraftContent('');
                    setBriefNotes('');
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Insert & Send Reply</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVIEW & GRAMMAR POLISH (Goal 2 Task 4 & 5) */}
        {activeTab === 'review' && (
          <div className="space-y-3">
            {!draftContent ? (
              <div className="p-6 text-center text-slate-400">
                <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>Generate or write a draft first to review tone, grammar, and clarity.</p>
              </div>
            ) : !reviewResult ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-slate-600">
                  Ready to audit draft for grammar, clarity, and tone alignment.
                </p>
                <button
                  onClick={handleReviewDraft}
                  disabled={isReviewing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isReviewing ? 'Auditing with Gemini...' : 'Run Tone & Grammar Review'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Score Meters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Clarity Score
                    </span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {reviewResult.clarityScore}/100
                    </span>
                  </div>

                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">
                      Tone Rating
                    </span>
                    <span className="text-xs font-bold text-purple-700 block truncate">
                      {reviewResult.toneRating}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {reviewResult.toneSummary}
                </p>

                {/* Suggestions List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Suggested Improvements ({reviewResult.suggestions.length})
                  </span>

                  {reviewResult.suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="uppercase font-bold text-purple-700 bg-purple-100 px-1 rounded">
                          {sug.type}
                        </span>
                        <span className="text-slate-400">Preserves intent</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-rose-600 line-through mr-1">
                          {sug.originalPhrase}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 inline mx-0.5 text-slate-400" />
                        <span className="text-emerald-700 font-semibold">{sug.suggestedFix}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{sug.reason}</p>
                    </div>
                  ))}
                </div>

                {/* Accept Polished Version Button */}
                <button
                  onClick={handleApplyPolishedVersion}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Apply Polished Revisions</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REUSABLE TEMPLATES (Goal 2 Task 2) */}
        {activeTab === 'templates' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 mb-2">
              Select a battle-tested template to prefill prompt and tone instructions:
            </p>

            {PROMPT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className="p-2.5 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 group-hover:text-purple-700">
                    {tmpl.title}
                  </span>
                  <span className="text-[9px] bg-slate-200 group-hover:bg-purple-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                    {tmpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{tmpl.description}</p>
                <div className="flex items-center justify-between text-[10px] text-purple-600 font-medium pt-1">
                  <span>Tone: {tmpl.defaultTone}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Use &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
