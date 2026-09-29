import React, { useState } from 'react';
import {
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Paperclip,
  Sparkles,
  Download,
  CheckCircle,
  Clock,
  Send,
  User,
  ExternalLink,
} from 'lucide-react';
import { EmailThread } from '../types';
import { AISummaryCard } from './AISummaryCard';
import { AIAssistantDrawer } from './AIAssistantDrawer';

interface EmailDetailProps {
  thread: EmailThread;
  onToggleStar: (threadId: string) => void;
  onArchive: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onUpdateThreadSummary: (threadId: string, summary: EmailThread['summary']) => void;
  onAddReply: (threadId: string, messageBody: string) => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  thread,
  onToggleStar,
  onArchive,
  onDelete,
  onUpdateThreadSummary,
  onAddReply,
}) => {
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);

  const accountBadge =
    thread.accountType === 'gmail'
      ? { label: 'Gmail Account', bg: 'bg-red-50 text-red-700 border-red-200' }
      : thread.accountType === 'outlook'
      ? { label: 'Outlook 365 Account', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      : { label: 'Apex IMAP / Work', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  const handleSendQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyText.trim()) return;
    onAddReply(thread.id, quickReplyText);
    setQuickReplyText('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-white select-none">
      {/* Main Reading & Interaction Pane */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto border-r border-slate-100">
        {/* Thread Action Header */}
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accountBadge.bg}`}
                >
                  {accountBadge.label}
                </span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">{thread.accountName}</span>
                {thread.priority === 'high' && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    Urgent Priority
                  </span>
                )}
              </div>

              <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                {thread.subject}
              </h2>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onToggleStar(thread.id)}
                className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                title={thread.starred ? 'Starred' : 'Star'}
              >
                <Star
                  className={`w-4 h-4 ${thread.starred ? 'text-amber-400 fill-amber-400' : ''}`}
                />
              </button>

              <button
                onClick={() => onArchive(thread.id)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(thread.id)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                  showAiAssistant
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Toggle AI Email Assistant Copilot (Goal 2)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Copilot</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {thread.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-w-4xl">
          {/* Goal 3 AI Thread Summary */}
          <AISummaryCard thread={thread} onUpdateThreadSummary={onUpdateThreadSummary} />

          {/* Chronological Messages Timeline */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Thread Conversation ({thread.messages.length} messages)</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {thread.messages.map((msg, index) => {
              const isLast = index === thread.messages.length - 1;
              const isExpanded = expandedMsgId === msg.id || isLast;

              return (
                <div
                  key={msg.id}
                  className={`border rounded-2xl transition-all ${
                    isExpanded
                      ? 'border-slate-200 bg-white shadow-xs p-4'
                      : 'border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-100 cursor-pointer'
                  }`}
                  onClick={() => !isExpanded && setExpandedMsgId(msg.id)}
                >
                  {/* Sender Row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {msg.sender.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {msg.sender}
                          </span>
                          <span className="text-[11px] text-slate-400">&lt;{msg.senderEmail}&gt;</span>
                        </div>
                        <p className="text-[10px] text-slate-400">To: {msg.recipient}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{msg.date}</span>
                      {!isExpanded && (
                        <button className="text-xs text-blue-600 hover:underline">Expand</button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {isExpanded && (
                    <div className="space-y-3 pt-1">
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                        {msg.body}
                      </div>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Attachments ({msg.attachments.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((att, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{att.name}</span>
                                <span className="text-[10px] text-slate-400">({att.size})</span>
                                <Download className="w-3 h-3 text-slate-400 hover:text-slate-700 ml-1 cursor-pointer" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Direct Composer box */}
          <div className="pt-4 border-t border-slate-200">
            <form onSubmit={handleSendQuickReply} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reply to Thread</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiAssistant(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Open AI Copilot to draft</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={quickReplyText}
                  onChange={(e) => setQuickReplyText(e.target.value)}
                  placeholder="Type a quick direct reply, or use the AI Assistant panel on the right..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-800 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!quickReplyText.trim()}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Goal 2 AI Copilot Drawer */}
      <AIAssistantDrawer
        thread={thread}
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        onSendReply={(body) => onAddReply(thread.id, body)}
      />
    </div>
  );
};
