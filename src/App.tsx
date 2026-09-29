/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { WorksheetTrackerModal } from './components/WorksheetTrackerModal';
import { DailyDigestModal } from './components/DailyDigestModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { ComposeModal } from './components/ComposeModal';
import { ConfirmSendModal } from './components/ConfirmSendModal';
import { INITIAL_ACCOUNTS, INITIAL_THREADS } from './data/mockEmails';
import { EmailAccount, EmailThread } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import { fetchUserGmailThreads, sendGmailMessage } from './services/gmailService';
import {
  loginWithMicrosoft,
  logoutMicrosoft,
  getMicrosoftAccessToken,
  getActiveMicrosoftAccount,
} from './services/microsoftAuth';
import { fetchOutlookRealThreads, sendOutlookRealMessage } from './services/outlookGraphService';
import { User } from 'firebase/auth';
import { AccountInfo } from '@azure/msal-browser';
import { Mail, Sparkles, CheckCircle, Bell, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  // Accounts state
  const [accounts, setAccounts] = useState<EmailAccount[]>(() => {
    const saved = localStorage.getItem('omnimail_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Threads state
  const [threads, setThreads] = useState<EmailThread[]>(() => {
    const saved = localStorage.getItem('omnimail_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
  });

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(INITIAL_THREADS[0].id);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'high' | 'deadlines'>('all');

  // Real Google User Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Real Microsoft MSAL.js OAuth state
  const [microsoftAccount, setMicrosoftAccount] = useState<AccountInfo | null>(null);
  const [isSyncingOutlook, setIsSyncingOutlook] = useState(false);

  // Modals state
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [isDailyDigestOpen, setIsDailyDigestOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Mandatory Confirm Send Modal state
  const [confirmSendState, setConfirmSendState] = useState<{
    isOpen: boolean;
    recipient: string;
    subject: string;
    body: string;
    threadId?: string;
    isSending: boolean;
    accountName: string;
    isRealGmail: boolean;
  }>({
    isOpen: false,
    recipient: '',
    subject: '',
    body: '',
    isSending: false,
    accountName: 'Gmail',
    isRealGmail: false,
  });

  // Live Toast Notification
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    account: string;
    threadId: string;
  } | null>(null);

  // Notifications feed (Goal 1 Task 4)
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      account: string;
      sender: string;
      subject: string;
      time: string;
      unread: boolean;
      threadId?: string;
    }>
  >([
    {
      id: 'notif-1',
      account: 'Microsoft 365 Outlook',
      sender: 'Sarah Jenkins (VP Strategy)',
      subject: 'Quarterly Performance Report - pre-read due Friday 3 PM',
      time: '10:42 AM',
      unread: true,
      threadId: 'thread-1',
    },
    {
      id: 'notif-2',
      account: 'Google Gmail',
      sender: 'Elena Rostova (Lumina Brands)',
      subject: 'Social Media Calendar Oct revisions needed by Thursday',
      time: '9:15 AM',
      unread: true,
      threadId: 'thread-2',
    },
  ]);

  // Audio chime using browser Web Audio API
  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // AudioContext unavailable
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        syncLiveGmail(token, user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persist demo changes to localStorage
  useEffect(() => {
    localStorage.setItem('omnimail_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    // Only persist non-live threads to avoid bloat
    const nonLiveThreads = threads.filter((t) => !t.id.startsWith('live-gmail-'));
    localStorage.setItem('omnimail_threads', JSON.stringify(nonLiveThreads));
  }, [threads]);

  // Check for active Microsoft account on mount
  useEffect(() => {
    getActiveMicrosoftAccount().then(async (acc) => {
      if (acc) {
        setMicrosoftAccount(acc);
        try {
          const token = await getMicrosoftAccessToken(acc);
          if (token) {
            await syncLiveOutlook(token, acc);
          }
        } catch (e) {
          console.warn('MSAL silent token acquisition on mount:', e);
        }
      }
    });
  }, []);

  // Sync Live Gmail Threads using access token
  const syncLiveGmail = async (token: string, user?: User | null) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const liveThreads = await fetchUserGmailThreads(token, 12);

      // Add or update real Gmail account in the account switcher
      const email = user?.email || currentUser?.email || 'your-email@gmail.com';
      const realAcc: EmailAccount = {
        id: 'acc-real-gmail',
        name: `Gmail (${email})`,
        email: email,
        type: 'gmail',
        color: '#EA4335',
        unreadCount: liveThreads.filter((t) => t.unread).length,
        status: 'connected',
        lastSynced: 'Just now',
        avatar: user?.photoURL || undefined,
      };

      setAccounts((prev) => {
        const withoutOldReal = prev.filter((a) => a.id !== 'acc-real-gmail');
        return [realAcc, ...withoutOldReal];
      });

      // Merge live threads into thread list
      setThreads((prev) => {
        const withoutOldLive = prev.filter((t) => !t.id.startsWith('live-gmail-'));
        return [...liveThreads, ...withoutOldLive];
      });

      if (liveThreads.length > 0) {
        setSelectedThreadId(liveThreads[0].id);
        setSelectedAccountId('acc-real-gmail');
      }

      playChime();
      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Gmail Connected Successfully!',
        message: `Fetched ${liveThreads.length} live threads from ${email}`,
        account: 'Google Gmail (Live)',
        threadId: liveThreads[0]?.id || '',
      });
      setTimeout(() => setActiveToast(null), 6000);
    } catch (err: any) {
      console.error('Failed to sync live Gmail:', err);
      setSyncError(err?.message || 'Failed to sync Gmail');
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sign-In Action
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        await syncLiveGmail(result.accessToken, result.user);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      alert(`Sign in could not be completed: ${err?.message || 'Please check popup settings.'}`);
    }
  };

  // Sign out Action
  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccounts((prev) => prev.filter((a) => a.id !== 'acc-real-gmail'));
    setThreads((prev) => prev.filter((t) => !t.id.startsWith('live-gmail-')));
    setSelectedAccountId(null);
    setSelectedThreadId(INITIAL_THREADS[0].id);
  };

  // Manual Re-sync
  const handleManualSync = async () => {
    const token = await getAccessToken();
    if (token) {
      await syncLiveGmail(token, currentUser);
    } else {
      await handleGoogleSignIn();
    }
  };

  // Sync Live Outlook using Microsoft Graph API (MSAL.js)
  const syncLiveOutlook = async (token: string, account: AccountInfo) => {
    setIsSyncingOutlook(true);
    try {
      const liveThreads = await fetchOutlookRealThreads(token, 12);

      const realOutlookAcc: EmailAccount = {
        id: 'acc-real-outlook',
        name: `Outlook (${account.username})`,
        email: account.username,
        type: 'outlook',
        color: '#0078D4',
        unreadCount: liveThreads.filter((t) => t.unread).length,
        status: 'connected',
        lastSynced: 'Just now',
      };

      setAccounts((prev) => {
        const withoutOld = prev.filter(
          (a) => a.id !== 'acc-real-outlook' && a.id !== 'acc-outlook'
        );
        return [realOutlookAcc, ...withoutOld];
      });

      setThreads((prev) => {
        const withoutOldLive = prev.filter((t) => !t.id.startsWith('live-outlook-'));
        return [...liveThreads, ...withoutOldLive];
      });

      if (liveThreads.length > 0) {
        setSelectedThreadId(liveThreads[0].id);
        setSelectedAccountId('acc-real-outlook');
      }

      playChime();
      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Microsoft Outlook (MSAL) Connected!',
        message: `Fetched ${liveThreads.length} live threads from ${account.username}`,
        account: 'Microsoft Outlook (Live)',
        threadId: liveThreads[0]?.id || '',
      });
      setTimeout(() => setActiveToast(null), 6000);
    } catch (err: any) {
      console.error('Failed to sync live Outlook via Graph API:', err);
    } finally {
      setIsSyncingOutlook(false);
    }
  };

  // Microsoft OAuth Login via MSAL.js
  const handleMicrosoftOAuthLogin = async (customClientId?: string, tenantId?: string) => {
    try {
      const result = await loginWithMicrosoft(customClientId, tenantId);
      setMicrosoftAccount(result.account);
      await syncLiveOutlook(result.accessToken, result.account);
    } catch (err: any) {
      console.error('MSAL Login error:', err);
      throw err;
    }
  };

  // Microsoft OAuth Logout via MSAL.js
  const handleMicrosoftOAuthLogout = async () => {
    await logoutMicrosoft();
    setMicrosoftAccount(null);
    setAccounts((prev) => prev.filter((a) => a.id !== 'acc-real-outlook'));
    setThreads((prev) => prev.filter((t) => !t.id.startsWith('live-outlook-')));
    setSelectedAccountId(null);
  };

  // Connect Microsoft Outlook (Real Microsoft 365 / Graph / IMAP)
  const handleOutlookConnect = async (email: string, pass: string, isGraph: boolean) => {
    try {
      const res = await fetch('/api/email/outlook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();

      const outlookAcc: EmailAccount = {
        id: 'acc-outlook',
        name: `Outlook (${email})`,
        email,
        type: 'outlook',
        color: '#0078D4',
        unreadCount: 4,
        status: 'connected',
        lastSynced: 'Just now',
      };

      setAccounts((prev) => {
        const withoutOld = prev.filter((a) => a.id !== 'acc-outlook');
        return [outlookAcc, ...withoutOld];
      });

      playChime();
      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Microsoft 365 Outlook Connected!',
        message: `Synchronized with ${email}`,
        account: 'Microsoft Outlook (Live)',
        threadId: 'thread-1',
      });
      setTimeout(() => setActiveToast(null), 5000);
    } catch (err: any) {
      console.error('Outlook connect error:', err);
    }
  };

  // Connect Apex Consulting Work (Custom IMAP / SMTP)
  const handleWorkConnect = async (email: string, pass: string, imap: string, smtp: string) => {
    try {
      const res = await fetch('/api/email/work/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, imapHost: imap, smtpHost: smtp }),
      });
      const data = await res.json();

      const workAcc: EmailAccount = {
        id: 'acc-work',
        name: email.includes('apex') ? `Apex Consulting (${email})` : `Work Mail (${email})`,
        email,
        type: 'work',
        color: '#10B981',
        unreadCount: 1,
        status: 'connected',
        lastSynced: 'Just now',
      };

      setAccounts((prev) => {
        const withoutOld = prev.filter((a) => a.id !== 'acc-work');
        return [workAcc, ...withoutOld];
      });

      playChime();
      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Apex Consulting Mail Connected!',
        message: `IMAP gateway active for ${email}`,
        account: 'Apex Advisory (Work)',
        threadId: 'thread-3',
      });
      setTimeout(() => setActiveToast(null), 5000);
    } catch (err: any) {
      console.error('Work connect error:', err);
    }
  };

  // Filtered threads logic
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      // Account filter
      if (selectedAccountId && t.accountId !== selectedAccountId) return false;

      // Folder filter
      if (selectedFolder === 'starred' && !t.starred) return false;
      if (selectedFolder === 'action-required') {
        const hasUncompletedTasks =
          t.summary?.actionItems?.some((a) => !a.completed) ?? false;
        if (!hasUncompletedTasks) return false;
      }
      if (selectedFolder === 'archive' && !t.tags.includes('Archive')) return false;

      // Category filter
      if (selectedCategory && t.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesSender = t.messages.some(
          (m) =>
            m.sender.toLowerCase().includes(q) ||
            m.senderEmail.toLowerCase().includes(q) ||
            m.body.toLowerCase().includes(q)
        );
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesSummary =
          t.summary?.executiveSummary?.toLowerCase().includes(q) ||
          t.summary?.deadlines?.some((d) => d.item.toLowerCase().includes(q));
        if (!matchesSubject && !matchesSender && !matchesTag && !matchesSummary) {
          return false;
        }
      }

      return true;
    });
  }, [threads, selectedAccountId, selectedFolder, selectedCategory, searchQuery]);

  // Selected thread object
  const currentThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || null;
  }, [threads, selectedThreadId, filteredThreads]);

  // Unread counts calculation
  const unreadCounts = useMemo(() => {
    const inbox = threads.filter((t) => t.unread).length;
    const actionRequired = threads.filter(
      (t) => t.summary?.actionItems?.some((a) => !a.completed) ?? false
    ).length;
    const starred = threads.filter((t) => t.starred).length;
    return { inbox, actionRequired, starred };
  }, [threads]);

  // Thread actions
  const handleSelectThread = (thread: EmailThread) => {
    setSelectedThreadId(thread.id);
    if (thread.unread) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
      );
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === thread.accountId && a.unreadCount > 0
            ? { ...a, unreadCount: a.unreadCount - 1 }
            : a
        )
      );
    }
  };

  const handleToggleStar = (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, starred: !t.starred } : t))
    );
  };

  const handleArchive = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, tags: [...t.tags, 'Archive'], unread: false } : t
      )
    );
  };

  const handleDelete = (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
    }
  };

  const handleUpdateThreadSummary = (
    threadId: string,
    newSummary: EmailThread['summary']
  ) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, summary: newSummary } : t))
    );
  };

  // Reply handler: Prompts confirmation dialog for user safety
  const handleInitiateReply = (threadId: string, body: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const latestMsg = thread.messages[thread.messages.length - 1];
    const recipient = latestMsg?.senderEmail || latestMsg?.sender || 'Recipient';
    const isRealGmail = thread.accountId === 'acc-real-gmail' || thread.id.startsWith('live-gmail-');
    const isOutlook = thread.accountType === 'outlook';
    const isWork = thread.accountType === 'work';

    let accountDisplayName = thread.accountName;
    if (isRealGmail) {
      accountDisplayName = `Live Gmail (${currentUser?.email})`;
    } else if (isOutlook) {
      accountDisplayName = `Microsoft Outlook (${thread.accountName})`;
    } else if (isWork) {
      accountDisplayName = `Apex Consulting (${thread.accountName})`;
    }

    setConfirmSendState({
      isOpen: true,
      recipient,
      subject: `Re: ${thread.subject}`,
      body,
      threadId,
      isSending: false,
      accountName: accountDisplayName,
      isRealGmail,
    });
  };

  // Confirmed Dispatch Execution
  const handleConfirmSend = async () => {
    const { threadId, recipient, subject, body, isRealGmail, accountName } = confirmSendState;
    setConfirmSendState((prev) => ({ ...prev, isSending: true }));

    try {
      if (isRealGmail) {
        const token = await getAccessToken();
        if (!token) throw new Error('No active Gmail session token. Please re-authenticate.');
        await sendGmailMessage(token, recipient, subject, body, threadId);
      } else if (accountName.includes('Outlook')) {
        if (microsoftAccount) {
          const token = await getMicrosoftAccessToken(microsoftAccount);
          await sendOutlookRealMessage(token, recipient, subject, body);
        } else {
          await fetch('/api/email/outlook/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: recipient, subject, body }),
          });
        }
      } else if (accountName.includes('Apex') || accountName.includes('Work')) {
        await fetch('/api/email/work/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipient, subject, body }),
        });
      }

      // Append sent message to local thread UI
      if (threadId) {
        const newMsg = {
          id: `msg-${Date.now()}`,
          sender: currentUser?.displayName
            ? `${currentUser.displayName} (You)`
            : isRealGmail
            ? `You (${currentUser?.email})`
            : 'You',
          senderEmail: currentUser?.email || (accountName.includes('Apex') ? 'raj@apexadvisory.io' : 'raj.nanda@enterprise365.com'),
          recipient,
          date: 'Just now',
          body,
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  unread: false,
                  messages: [...t.messages, newMsg],
                  snippet: `You: ${body.slice(0, 100)}...`,
                  date: 'Just now',
                }
              : t
          )
        );
      }

      setConfirmSendState((prev) => ({ ...prev, isOpen: false, isSending: false }));

      setActiveToast({
        id: `toast-${Date.now()}`,
        title: isRealGmail ? 'Email Sent via Gmail API' : accountName.includes('Outlook') ? 'Email Sent via Outlook API' : 'Email Sent via Apex IMAP/SMTP',
        message: `Successfully transmitted to ${recipient}`,
        account: accountName,
        threadId: threadId || '',
      });
      setTimeout(() => setActiveToast(null), 5000);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      alert(`Could not send email: ${err?.message || 'Unknown transmission error'}`);
      setConfirmSendState((prev) => ({ ...prev, isSending: false }));
    }
  };

  // Simulate incoming live email (Goal 1 Task 5)
  const handleSimulateIncoming = (provider: 'gmail' | 'outlook') => {
    playChime();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const simulated: EmailThread = {
      id: `sim-${provider}-${Date.now()}`,
      accountId: provider === 'gmail' ? 'acc-gmail' : 'acc-outlook',
      accountType: provider,
      accountName: provider === 'gmail' ? 'Gmail' : 'Outlook (Corp)',
      subject:
        provider === 'gmail'
          ? `New Client Brief: Q4 Brand Campaign Assets (${timestamp})`
          : `Urgent Leadership Memo: Quarterly OKR Sync (${timestamp})`,
      snippet:
        provider === 'gmail'
          ? 'Hi Raj, we just approved the media spend for Q4! Can you review the specs...'
          : 'Please add your division’s Q3 metrics to the master slide deck before 2 PM...',
      unread: true,
      starred: false,
      priority: 'high',
      category: provider === 'gmail' ? 'client' : 'work',
      tags: ['Simulated', provider.toUpperCase()],
      date: 'Just now',
      messages: [
        {
          id: `msg-sim-${Date.now()}`,
          sender: provider === 'gmail' ? 'Chloe Davenport (Chief Brand Officer)' : 'David Sterling (EVP Operations)',
          senderEmail: provider === 'gmail' ? 'chloe.d@brandinnovations.com' : 'david.s@enterprise365.com',
          recipient: currentUser?.email || 'mail2rajnanda@gmail.com',
          date: 'Just now',
          body:
            provider === 'gmail'
              ? `Hi Raj,\n\nOur executive committee just released the budget for the Q4 Brand Campaign.\n\nWe need the finalized creative specs and delivery schedule submitted by Wednesday 4 PM. Could you confirm if your team can support this turnaround?\n\nBest,\nChloe`
              : `Hi Raj,\n\nWe are compiling the quarterly OKR alignment deck for the CEO briefing. Please verify your team\'s completion percentages before 2:00 PM today.\n\nThanks,\nDavid`,
        },
      ],
      summary: {
        executiveSummary:
          provider === 'gmail'
            ? 'Chloe Davenport announced Q4 Brand Campaign budget approval and requires creative specs by Wednesday 4 PM.'
            : 'David Sterling requests division OKR metrics for the CEO briefing before 2:00 PM today.',
        keyTakeaways: [
          provider === 'gmail'
            ? 'Deliver specs by Wednesday at 4 PM'
            : 'Division OKR numbers required today before 2 PM',
        ],
        deadlines: [
          {
            item: provider === 'gmail' ? 'Submit creative specs & schedule' : 'Update OKR slides',
            date: provider === 'gmail' ? 'Wednesday 4:00 PM' : 'Today at 2:00 PM',
            urgency: 'high',
          },
        ],
        actionItems: [
          {
            id: `act-${Date.now()}`,
            task: provider === 'gmail' ? 'Confirm capacity to Chloe' : 'Review OKR slide inputs',
            assignee: 'You',
            completed: false,
          },
        ],
        sentiment: 'urgent',
      },
    };

    setThreads((prev) => [simulated, ...prev]);
    setSelectedThreadId(simulated.id);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        account: simulated.accountName,
        sender: simulated.messages[0].sender,
        subject: simulated.subject,
        time: timestamp,
        unread: true,
        threadId: simulated.id,
      },
      ...prev,
    ]);

    setActiveToast({
      id: simulated.id,
      title: `New Email Received from ${simulated.accountName}`,
      message: simulated.subject,
      account: simulated.accountName,
      threadId: simulated.id,
    });
    setTimeout(() => setActiveToast(null), 5000);
  };

  // Worksheet Action execution dispatcher
  const handleExecuteWorksheetAction = (actionKey: string) => {
    switch (actionKey) {
      case 'open-accounts':
        setIsAccountsOpen(true);
        break;
      case 'filter-all':
        setSelectedAccountId(null);
        setSelectedFolder('inbox');
        break;
      case 'toggle-notifications':
        playChime();
        break;
      case 'simulate-email':
        handleSimulateIncoming('gmail');
        break;
      case 'open-daily-digest':
        setIsDailyDigestOpen(true);
        break;
      case 'open-ai-composer':
        setIsComposeOpen(true);
        break;
      case 'open-privacy-settings':
        setIsPrivacyOpen(true);
        break;
      default:
        if (threads[0]) setSelectedThreadId(threads[0].id);
        break;
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('omnimail_accounts');
    localStorage.removeItem('omnimail_threads');
    setAccounts(INITIAL_ACCOUNTS);
    setThreads(INITIAL_THREADS);
    setSelectedThreadId(INITIAL_THREADS[0].id);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* OmniMail Top Navigation with Real Google Auth */}
      <Header
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
        onOpenWorksheet={() => setIsWorksheetOpen(true)}
        onOpenAccounts={() => setIsAccountsOpen(true)}
        onSimulateIncoming={handleSimulateIncoming}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onSelectThreadById={(id) => id && setSelectedThreadId(id)}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
        onSyncMailbox={handleManualSync}
        microsoftAccount={microsoftAccount}
      />

      {/* Sync Error Notice if applicable */}
      {syncError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Gmail Sync: {syncError}</span>
          </div>
          <button
            onClick={handleManualSync}
            className="font-bold underline hover:text-rose-900"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main 3-Pane Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          accounts={accounts}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenAccounts={() => setIsAccountsOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenWorksheet={() => setIsWorksheetOpen(true)}
          unreadCounts={unreadCounts}
          currentUser={currentUser}
          onGoogleSignIn={handleGoogleSignIn}
        />

        {/* Middle Column: Email Thread List */}
        <EmailList
          threads={filteredThreads}
          selectedThreadId={selectedThreadId}
          onSelectThread={handleSelectThread}
          onToggleStar={handleToggleStar}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
        />

        {/* Right Column: Email Detail Reading Pane & AI Assistant */}
        {currentThread ? (
          <EmailDetail
            key={currentThread.id}
            thread={currentThread}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onUpdateThreadSummary={handleUpdateThreadSummary}
            onAddReply={handleInitiateReply}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white text-slate-400 select-none">
            <Mail className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No Email Selected</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select an email from your unified inbox to read messages, view AI summaries, or draft replies.
            </p>
          </div>
        )}
      </div>

      {/* Floating Toast Alert */}
      {activeToast && (
        <div
          onClick={() => {
            if (activeToast.threadId) setSelectedThreadId(activeToast.threadId);
            setActiveToast(null);
          }}
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-start gap-3 max-w-md cursor-pointer hover:bg-slate-800 transition-all animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold mb-0.5">
              <span>{activeToast.account}</span>
              <span>Just now</span>
            </div>
            <h4 className="text-xs font-bold text-white truncate">{activeToast.title}</h4>
            <p className="text-[11px] text-slate-300 line-clamp-1">{activeToast.message}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      <WorksheetTrackerModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        onExecuteAction={handleExecuteWorksheetAction}
      />

      <DailyDigestModal
        isOpen={isDailyDigestOpen}
        onClose={() => setIsDailyDigestOpen(false)}
        threads={threads}
        accounts={accounts}
        onSelectThreadById={(id) => {
          setSelectedThreadId(id);
          setIsDailyDigestOpen(false);
        }}
      />

      <AccountManagerModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        accounts={accounts}
        onAddAccount={(newAcc) => setAccounts((prev) => [...prev, newAcc])}
        onRemoveAccount={(accId) => setAccounts((prev) => prev.filter((a) => a.id !== accId))}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        microsoftAccount={microsoftAccount}
        onMicrosoftOAuthLogin={handleMicrosoftOAuthLogin}
        onMicrosoftOAuthLogout={handleMicrosoftOAuthLogout}
        onOutlookConnect={handleOutlookConnect}
        onWorkConnect={handleWorkConnect}
      />

      <PrivacySettingsModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onResetData={handleResetData}
      />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        accounts={accounts}
        onSendEmail={(newThread) => {
          const isReal = newThread.accountId === 'acc-real-gmail';
          const recipient = (newThread.messages as any)?.[0]?.recipient || 'Recipient';
          const body = (newThread.messages as any)?.[0]?.body || '';

          if (isReal) {
            setConfirmSendState({
              isOpen: true,
              recipient,
              subject: newThread.subject || 'Untitled',
              body,
              isSending: false,
              accountName: `Live Gmail (${currentUser?.email})`,
              isRealGmail: true,
            });
          } else {
            const fullThread: EmailThread = {
              id: `thread-${Date.now()}`,
              accountId: newThread.accountId || accounts[0].id,
              accountType: newThread.accountType || 'gmail',
              accountName: newThread.accountName || accounts[0].name,
              subject: newThread.subject || 'New Message',
              snippet: newThread.snippet || '',
              unread: false,
              starred: false,
              priority: 'medium',
              category: 'work',
              tags: ['Sent', 'Outgoing'],
              date: 'Just now',
              messages: (newThread.messages as any) || [],
            };
            setThreads((prev) => [fullThread, ...prev]);
            setSelectedThreadId(fullThread.id);
          }
        }}
      />

      {/* Mandatory User Confirmation Dialog before transmitting real email */}
      <ConfirmSendModal
        isOpen={confirmSendState.isOpen}
        onClose={() => setConfirmSendState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmSend}
        recipient={confirmSendState.recipient}
        subject={confirmSendState.subject}
        bodyPreview={confirmSendState.body}
        isSending={confirmSendState.isSending}
        accountName={confirmSendState.accountName}
      />
    </div>
  );
}
