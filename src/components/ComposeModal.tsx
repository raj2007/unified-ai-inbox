import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  Trash2,
  Wand2,
  FileCheck2,
  Check,
  RotateCw,
} from 'lucide-react';
import { EmailAccount, EmailThread } from '../types';
import { TONE_OPTIONS } from '../data/mockEmails';
import { generateEmailDraft, reviewEmailDraft } from '../services/aiService';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  onSendEmail: (newThread: Partial<EmailThread>) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSendEmail,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // AI Assistance states
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [briefNotes, setBriefNotes] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleAiDraft = async () => {
    if (!briefNotes.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateEmailDraft({
        briefNotes,
        tone: selectedTone,
        length: selectedLength,
        recipientName: recipient.split('@')[0],
        subject: subject,
      });

      if (res.subject && !subject) setSubject(res.subject);
      setBody(res.draft);
      setShowAiDraft(false);
    } catch (e) {
      console.error('Draft error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePolish = async () => {
    if (!body.trim()) return;
    setIsPolishing(true);
    try {
      const res = await reviewEmailDraft(body, selectedTone);
      if (res.improvedDraft) {
        setBody(res.improvedDraft);
      }
    } catch (e) {
      console.error('Polish error:', e);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !body) return;

    const newThread: Partial<EmailThread> = {
      accountId: currentAccount.id,
      accountType: currentAccount.type,
      accountName: currentAccount.name,
      subject: subject || 'Untitled Message',
      snippet: body.slice(0, 100) + '...',
      unread: false,
      starred: false,
      priority: 'medium',
      category: 'work',
      tags: ['Outgoing', 'Sent'],
      date: 'Just now',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: `You (${currentAccount.name})`,
          senderEmail: currentAccount.email,
          recipient: recipient,
          date: 'Just now',
          body: body,
        },
      ],
    };

    onSendEmail(newThread);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs">New Message</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
              Universal Composer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiDraft(!showAiDraft)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                showAiDraft
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Draft Assistant</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
              ✕
            </button>
          </div>
        </div>

        {/* AI Generator Dropdown / Panel */}
        {showAiDraft && (
          <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Turn Brief Notes into Full Email (Goal 2 Task 3)</span>
              </span>
              <span className="text-[10px] text-purple-700">Powered by Gemini 3.8 Flash</span>
            </div>

            <textarea
              value={briefNotes}
              onChange={(e) => setBriefNotes(e.target.value)}
              placeholder="Enter quick informal bullets, e.g.: Reschedule client demo from Wednesday to Friday, send updated pitch deck, confirm team members attending..."
              rows={2}
              className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 shadow-xs"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="p-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-700 outline-none"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value as any)}
                  className="p-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-700 outline-none"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAiDraft}
                disabled={isGenerating || !briefNotes.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Composer Form */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden text-xs">
          <div className="p-4 space-y-2.5 border-b border-slate-100">
            {/* Sender Account */}
            <div className="flex items-center gap-2">
              <label className="text-slate-400 font-semibold w-16">From:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div className="flex items-center gap-2">
              <label className="text-slate-400 font-semibold w-16">To:</label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@company.com"
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="text-slate-400 font-semibold w-16">Subject:</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Q3 Performance Summary & Action Next Steps"
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here, or use the 'AI Draft Assistant' above..."
              className="flex-1 w-full p-2 outline-none text-xs text-slate-800 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Footer Controls */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePolish}
                disabled={isPolishing || !body.trim()}
                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-xs border border-purple-200 flex items-center gap-1 transition-colors"
                title="Goal 2 Task 4: Polish grammar and tone"
              >
                <FileCheck2 className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
                <span>{isPolishing ? 'Polishing...' : 'AI Grammar & Tone Polish'}</span>
              </button>

              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
                title="Add attachment"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
