import React, { useState } from 'react';
import {
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Paperclip,
  Check,
  Filter,
} from 'lucide-react';
import { EmailThread } from '../types';

interface EmailListProps {
  threads: EmailThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: EmailThread) => void;
  onToggleStar: (threadId: string, e: React.MouseEvent) => void;
  filterTab: 'all' | 'unread' | 'high' | 'deadlines';
  onFilterTabChange: (tab: 'all' | 'unread' | 'high' | 'deadlines') => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onToggleStar,
  filterTab,
  onFilterTabChange,
}) => {
  const filteredThreads = threads.filter((t) => {
    if (filterTab === 'unread') return t.unread;
    if (filterTab === 'high') return t.priority === 'high';
    if (filterTab === 'deadlines') return (t.summary?.deadlines?.length || 0) > 0;
    return true;
  });

  return (
    <section className="w-96 border-r border-slate-200 bg-white h-[calc(100vh-4rem)] flex flex-col shrink-0 select-none">
      {/* Sub-header Filter Tabs */}
      <div className="p-2.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-slate-50/50">
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => onFilterTabChange('all')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({threads.length})
          </button>
          <button
            onClick={() => onFilterTabChange('unread')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterTab === 'unread'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => onFilterTabChange('high')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterTab === 'high'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Urgent
          </button>
          <button
            onClick={() => onFilterTabChange('deadlines')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterTab === 'deadlines'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deadlines
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {filteredThreads.length} items
        </span>
      </div>

      {/* Thread List Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No matching emails</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search or filter tabs.</p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = selectedThreadId === thread.id;
            const latestMsg = thread.messages[thread.messages.length - 1];
            const senderName = latestMsg?.sender?.split('(')[0] || 'Unknown';
            const hasDeadlines = (thread.summary?.deadlines?.length || 0) > 0;
            const pendingTasks =
              thread.summary?.actionItems?.filter((a) => !a.completed)?.length || 0;

            // Account pill color
            const accountPill =
              thread.accountType === 'gmail'
                ? { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Gmail' }
                : thread.accountType === 'outlook'
                ? { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Outlook' }
                : { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Work' };

            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`p-3 cursor-pointer transition-all border-l-3 relative ${
                  isSelected
                    ? 'bg-blue-50/60 border-l-blue-600 shadow-xs'
                    : thread.unread
                    ? 'bg-slate-50/70 hover:bg-slate-100/70 border-l-blue-400'
                    : 'bg-white hover:bg-slate-50 border-l-transparent'
                }`}
              >
                {/* Top Row: Account Badge, Sender, Date, Star */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${accountPill.bg}`}
                    >
                      {accountPill.label}
                    </span>
                    <span
                      className={`text-xs truncate ${
                        thread.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {senderName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400">{thread.date}</span>
                    <button
                      onClick={(e) => onToggleStar(thread.id, e)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                      title={thread.starred ? 'Starred' : 'Not starred'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          thread.starred ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <h4
                  className={`text-xs mb-1 line-clamp-1 ${
                    thread.unread ? 'font-semibold text-slate-900' : 'text-slate-800'
                  }`}
                >
                  {thread.subject}
                </h4>

                {/* Snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                  {thread.snippet}
                </p>

                {/* Badges Row: Deadlines, Actions, Priority */}
                <div className="flex items-center flex-wrap gap-1.5">
                  {thread.priority === 'high' && (
                    <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Urgent
                    </span>
                  )}

                  {hasDeadlines && (
                    <span className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> Deadline
                    </span>
                  )}

                  {pendingTasks > 0 && (
                    <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {pendingTasks} tasks
                    </span>
                  )}

                  {latestMsg?.attachments && latestMsg.attachments.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Paperclip className="w-2.5 h-2.5" /> {latestMsg.attachments.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
