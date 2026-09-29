import React, { useState } from 'react';
import {
  Mail,
  Search,
  Bell,
  Sparkles,
  ClipboardList,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { EmailAccount } from '../types';
import { User } from 'firebase/auth';
import { AccountInfo } from '@azure/msal-browser';

interface HeaderProps {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCompose: () => void;
  onOpenDailyDigest: () => void;
  onOpenWorksheet: () => void;
  onOpenAccounts: () => void;
  onSimulateIncoming: (provider: 'gmail' | 'outlook') => void;
  notifications: Array<{
    id: string;
    account: string;
    sender: string;
    subject: string;
    time: string;
    unread: boolean;
  }>;
  onClearNotifications: () => void;
  onSelectThreadById: (threadId?: string) => void;
  // Live Google Auth & Sync
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
  onSyncMailbox: () => void;
  // Microsoft MSAL Auth & Sync
  microsoftAccount?: AccountInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  searchQuery,
  onSearchChange,
  onOpenCompose,
  onOpenDailyDigest,
  onOpenWorksheet,
  onOpenAccounts,
  onSimulateIncoming,
  notifications,
  onClearNotifications,
  onSelectThreadById,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  isSyncing,
  onSyncMailbox,
  microsoftAccount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSimulateDropdown, setShowSimulateDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;
  const totalUnreadEmails = accounts.reduce((acc, a) => acc + a.unreadCount, 0);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-3 md:px-4 flex items-center justify-between gap-3 sticky top-0 z-30 select-none">
      {/* Left: Brand & Combined status */}
      <div className="flex items-center gap-2.5 min-w-[220px]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 tracking-tight text-sm md:text-base">
              OmniMail AI
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {currentUser ? 'Live Gmail Active' : `${accounts.length} Inboxes Synced`}
          </p>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex-1 max-w-xl relative hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Gmail, Outlook & Work emails by subject, sender, deadline or action..."
            className="w-full pl-9 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs md:text-sm transition-all outline-none text-slate-800 placeholder-slate-400 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Microsoft Outlook MSAL Status Badge */}
        {microsoftAccount && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span className="max-w-[100px] truncate">{microsoftAccount.username}</span>
          </div>
        )}

        {/* Real Live Google Workspace Sign-In / Account Status */}
        {currentUser ? (
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={onSyncMailbox}
              disabled={isSyncing}
              title="Sync your real Gmail inbox now"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden lg:inline">{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>

            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 transition-colors"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold hidden sm:inline max-w-[110px] truncate">
                {currentUser.displayName || currentUser.email}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2 text-xs">
                <div className="border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-900">Google Account Linked</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSyncMailbox();
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Refresh Real Inbox</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut();
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out of Gmail</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onGoogleSignIn}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 shrink-0"
            title="Sign in with your Google account to access your real email"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        )}

        {/* Goal 3: Daily Digest */}
        <button
          onClick={onOpenDailyDigest}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-colors"
          title="Goal 3 Task 3: Daily Morning Email Digest"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Digest</span>
        </button>

        {/* Goal Worksheet Blueprint */}
        <button
          onClick={onOpenWorksheet}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors"
          title="Goal Blueprint & Worksheet"
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden lg:inline">Worksheet</span>
          <span className="bg-emerald-600 text-white text-[10px] px-1 py-0.2 rounded-full font-bold">
            15/15
          </span>
        </button>

        {/* Live Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Unified Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-slate-900">Notifications</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    {unreadNotifsCount} new
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-slate-400 hover:text-slate-600"
                    title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={onClearNotifications}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications. Everything is calm.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectThreadById();
                      }}
                      className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        notif.unread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            notif.account.toLowerCase().includes('gmail')
                              ? 'bg-red-100 text-red-700'
                              : notif.account.toLowerCase().includes('outlook')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {notif.account}
                        </span>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate">{notif.sender}</p>
                      <p className="text-xs text-slate-500 truncate">{notif.subject}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Compose</span>
        </button>
      </div>
    </header>
  );
};
