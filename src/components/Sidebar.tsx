import React from 'react';
import {
  Inbox,
  Star,
  CheckSquare,
  Clock,
  Send,
  FileText,
  Archive,
  Trash2,
  PlusCircle,
  ShieldCheck,
  Settings,
  HelpCircle,
  ExternalLink,
  Tag,
  Briefcase,
  Users,
  DollarSign,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { EmailAccount } from '../types';
import { User } from 'firebase/auth';

interface SidebarProps {
  accounts: EmailAccount[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedAccountId: string | null;
  onSelectAccount: (accId: string | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onOpenAccounts: () => void;
  onOpenPrivacy: () => void;
  onOpenWorksheet: () => void;
  unreadCounts: {
    inbox: number;
    actionRequired: number;
    starred: number;
  };
  currentUser: User | null;
  onGoogleSignIn: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  accounts,
  selectedFolder,
  onSelectFolder,
  selectedAccountId,
  onSelectAccount,
  selectedCategory,
  onSelectCategory,
  onOpenAccounts,
  onOpenPrivacy,
  onOpenWorksheet,
  unreadCounts,
  currentUser,
  onGoogleSignIn,
}) => {
  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/70 h-[calc(100vh-4rem)] flex flex-col justify-between select-none overflow-y-auto shrink-0">
      <div className="p-3 space-y-4">
        {/* Real Live Gmail Account Card if not signed in */}
        {!currentUser && (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Connect Your Real Email</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Sign in with your Google account to read, draft, and summarize your actual emails.
            </p>
            <button
              onClick={onGoogleSignIn}
              className="w-full py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
        {/* Section 1: Accounts Switcher / Combined Selector */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Connected Inboxes (Goal 1)
            </span>
            <button
              onClick={onOpenAccounts}
              title="Add or configure accounts"
              className="text-slate-400 hover:text-blue-600 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {/* Unified / All Inboxes button */}
            <button
              onClick={() => onSelectAccount(null)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedAccountId === null
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                <span className="truncate">Combined All Inboxes</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  selectedAccountId === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {unreadCounts.inbox}
              </span>
            </button>

            {/* Individual Accounts */}
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const providerInitial =
                acc.type === 'gmail' ? 'G' : acc.type === 'outlook' ? 'O' : 'W';
              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: acc.color }}
                    >
                      {providerInitial}
                    </span>
                    <span className="truncate text-left">{acc.name}</span>
                  </div>
                  {acc.unreadCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {acc.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Smart Views & Folders */}
        <div>
          <div className="px-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Smart Views
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectFolder('inbox')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'inbox'
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-slate-500" />
                <span>Inbox</span>
              </div>
              <span className="text-[10px] text-slate-500">{unreadCounts.inbox}</span>
            </button>

            <button
              onClick={() => onSelectFolder('action-required')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'action-required'
                  ? 'bg-amber-100/70 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Action Items Pending</span>
              </div>
              <span className="text-[10px] bg-amber-200/70 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                {unreadCounts.actionRequired}
              </span>
            </button>

            <button
              onClick={() => onSelectFolder('starred')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'starred'
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Starred</span>
              </div>
              <span className="text-[10px] text-slate-500">{unreadCounts.starred}</span>
            </button>

            <button
              onClick={() => onSelectFolder('archive')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'archive'
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-slate-400" />
                <span>Archive</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Priority Categories */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Worksheet Categories
            </span>
            {selectedCategory && (
              <button
                onClick={() => onSelectCategory(null)}
                className="text-[10px] text-blue-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {[
              { id: 'work', label: 'Quarterly & Strategy', icon: Briefcase, color: 'text-blue-500' },
              { id: 'client', label: 'Client Deliverables', icon: Users, color: 'text-purple-500' },
              { id: 'finance', label: 'Vendor & Contracts', icon: DollarSign, color: 'text-emerald-500' },
              { id: 'onboarding', label: 'Revamp Onboarding', icon: GraduationCap, color: 'text-amber-500' },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer: App Goals & Privacy */}
      <div className="p-3 border-t border-slate-200 bg-white/70 space-y-2">
        <button
          onClick={onOpenWorksheet}
          className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Worksheet Goals</span>
            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
              15/15
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5 leading-snug">
            3 Goals • 15 Tasks Mapped
          </p>
        </button>

        <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
          <button
            onClick={onOpenPrivacy}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
            title="Privacy, Zero-Retention & Reliability (Goal 3 Task 5)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">Privacy & Reliability</span>
          </button>

          <button
            onClick={onOpenAccounts}
            className="text-slate-400 hover:text-slate-700 p-1"
            title="Account Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
