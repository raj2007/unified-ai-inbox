import React, { useState } from 'react';
import {
  Mail,
  Shield,
  CheckCircle2,
  Plus,
  RefreshCw,
  Server,
  Key,
  ExternalLink,
  Sliders,
  AlertTriangle,
  Info,
  Lock,
  ArrowRight,
  Trash2,
  Check,
  Building,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EmailAccount } from '../types';
import { User } from 'firebase/auth';
import { AccountInfo } from '@azure/msal-browser';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  onAddAccount: (newAcc: EmailAccount) => void;
  onRemoveAccount: (id: string) => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  // Microsoft MSAL.js OAuth props
  microsoftAccount: AccountInfo | null;
  onMicrosoftOAuthLogin: (customClientId?: string, tenantId?: string) => Promise<void>;
  onMicrosoftOAuthLogout: () => Promise<void>;
  // Fallback direct credentials
  onOutlookConnect: (email: string, pass: string, isGraph: boolean) => Promise<void>;
  onWorkConnect: (email: string, pass: string, imap: string, smtp: string) => Promise<void>;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onRemoveAccount,
  currentUser,
  onGoogleSignIn,
  microsoftAccount,
  onMicrosoftOAuthLogin,
  onMicrosoftOAuthLogout,
  onOutlookConnect,
  onWorkConnect,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'outlook' | 'apex' | 'gmail'>('all');

  // MSAL.js Custom settings
  const [showAdvancedAzure, setShowAdvancedAzure] = useState(false);
  const [customClientId, setCustomClientId] = useState(
    () => localStorage.getItem('omnimail_ms_client_id') || ''
  );
  const [tenantId, setTenantId] = useState('common');
  const [isLoggingInMsal, setIsLoggingInMsal] = useState(false);
  const [msalError, setMsalError] = useState<string | null>(null);

  // Direct Outlook credentials
  const [outlookEmail, setOutlookEmail] = useState('raj.nanda@enterprise365.com');
  const [outlookPass, setOutlookPass] = useState('••••••••••••');
  const [isConnectingOutlook, setIsConnectingOutlook] = useState(false);
  const [outlookSuccess, setOutlookSuccess] = useState(false);

  // Apex Consulting Work inputs
  const [workEmail, setWorkEmail] = useState('raj@apexadvisory.io');
  const [workPass, setWorkPass] = useState('••••••••••••');
  const [workImap, setWorkImap] = useState('mail.apexadvisory.io');
  const [workSmtp, setWorkSmtp] = useState('smtp.apexadvisory.io');
  const [isConnectingWork, setIsConnectingWork] = useState(false);
  const [workSuccess, setWorkSuccess] = useState(false);

  if (!isOpen) return null;

  const handleMsalLogin = async () => {
    setIsLoggingInMsal(true);
    setMsalError(null);
    try {
      await onMicrosoftOAuthLogin(customClientId.trim() || undefined, tenantId.trim() || undefined);
      setActiveTab('all');
    } catch (err: any) {
      console.error('MSAL Login Error:', err);
      setMsalError(err?.message || 'Microsoft OAuth login could not be completed.');
    } finally {
      setIsLoggingInMsal(false);
    }
  };

  const handleConnectOutlook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlookEmail) return;
    setIsConnectingOutlook(true);
    try {
      await onOutlookConnect(outlookEmail, outlookPass, true);
      setOutlookSuccess(true);
      setTimeout(() => {
        setOutlookSuccess(false);
        setActiveTab('all');
      }, 1000);
    } catch (err) {
      console.error('Outlook connect error:', err);
    } finally {
      setIsConnectingOutlook(false);
    }
  };

  const handleConnectApex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail) return;
    setIsConnectingWork(true);
    try {
      await onWorkConnect(workEmail, workPass, workImap, workSmtp);
      setWorkSuccess(true);
      setTimeout(() => {
        setWorkSuccess(false);
        setActiveTab('all');
      }, 1000);
    } catch (err) {
      console.error('Work connect error:', err);
    } finally {
      setIsConnectingWork(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Multi-Account Connection Hub
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  Real OAuth & Live Feeds
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sign into Google Gmail, Microsoft 365 Outlook (MSAL.js OAuth), and Apex Consulting work accounts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 bg-white text-xs font-semibold px-4 pt-1 gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connected Inboxes ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('outlook')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'outlook'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Microsoft Outlook (MSAL.js)</span>
            {microsoftAccount && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>
          <button
            onClick={() => setActiveTab('apex')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'apex'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Connect Apex Work</span>
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'gmail'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Google Gmail</span>
            {currentUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-xs space-y-4">
          {/* TAB 1: ALL CONNECTED INBOXES */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Active mailboxes connected to your unified inbox:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {accounts.map((acc) => {
                  const isRealGoogle = acc.id === 'acc-real-gmail';
                  const isRealOutlook = acc.id === 'acc-real-outlook';
                  return (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: acc.color }}
                        >
                          {acc.type === 'gmail' ? 'G' : acc.type === 'outlook' ? 'O' : 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{acc.name}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                acc.type === 'gmail'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : acc.type === 'outlook'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {acc.type.toUpperCase()}
                            </span>
                            {isRealGoogle && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Google OAuth 2.0
                              </span>
                            )}
                            {isRealOutlook && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                MSAL.js OAuth
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{acc.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            ● Active
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {acc.unreadCount} unread • {acc.lastSynced}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Connect CTA Cards */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('outlook')}
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      O
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {microsoftAccount ? 'Manage Microsoft Account' : 'Connect Microsoft Outlook (OAuth)'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {microsoftAccount ? microsoftAccount.username : 'Official MSAL.js PKCE Flow'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>

                <button
                  onClick={() => setActiveTab('apex')}
                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      A
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        Connect Apex Consulting
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Work IMAP / TLS corporate mail
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT OUTLOOK (MSAL.js REAL OAUTH FLOW) */}
          {activeTab === 'outlook' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    O
                  </div>
                  <span className="font-bold text-blue-950 text-xs">
                    Microsoft 365 & Outlook OAuth 2.0 (MSAL.js)
                  </span>
                </div>
                <p className="text-[11px] text-blue-900/80 leading-snug">
                  Permanent, secure token-based authentication using official MSAL.js. Supports personal Microsoft accounts (@outlook.com, @hotmail.com) and corporate Microsoft 365 / Entra ID work accounts.
                </p>
              </div>

              {/* Already Signed In via MSAL */}
              {microsoftAccount ? (
                <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {microsoftAccount.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {microsoftAccount.name || 'Microsoft 365 User'}
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Token Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{microsoftAccount.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={onMicrosoftOAuthLogout}
                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 border border-rose-200 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Authority:</span>
                      <code className="text-[10px] text-slate-800 font-mono">
                        login.microsoftonline.com
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Granted Scopes:</span>
                      <span className="text-[10px] font-semibold text-blue-700">
                        Mail.Read, Mail.Send, User.Read
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Signed In: Primary MSAL Button */
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 text-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Sign In with Microsoft Account
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                      Click below to open the official Microsoft sign-in popup. Grants secure token access to read and dispatch Outlook emails via Microsoft Graph API.
                    </p>
                  </div>

                  {msalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">OAuth Error:</span> {msalError}
                        <p className="text-[10px] text-rose-600 mt-0.5">
                          Make sure popups are allowed in your browser, or configure your custom Azure App Client ID below.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleMsalLogin}
                    disabled={isLoggingInMsal}
                    className="w-full max-w-sm mx-auto py-2.5 px-4 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white font-semibold rounded-xl text-xs shadow-md flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    {/* Official Microsoft 4-square SVG */}
                    <svg className="w-4 h-4" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    <span>
                      {isLoggingInMsal ? 'Opening Microsoft OAuth...' : 'Sign in with Microsoft'}
                    </span>
                  </button>

                  {/* Advanced Azure App Registration Client ID config */}
                  <div className="pt-2 border-t border-slate-100 text-left">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedAzure(!showAdvancedAzure)}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium mx-auto"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>
                        {showAdvancedAzure
                          ? 'Hide Azure Tenant / Client ID settings'
                          : 'Use custom Azure Application (Client) ID'}
                      </span>
                      {showAdvancedAzure ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {showAdvancedAzure && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Azure Application (Client) ID:
                          </label>
                          <input
                            type="text"
                            value={customClientId}
                            onChange={(e) => setCustomClientId(e.target.value)}
                            placeholder="e.g. ea5a67f6-b6f3-4338-b240-c655ddc3cc8e"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Azure Tenant ID / Directory:
                          </label>
                          <input
                            type="text"
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            placeholder="common (or your specific Azure tenant GUID)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                          />
                        </div>

                        <p className="text-[10px] text-slate-400 leading-snug">
                          Tip: Register an App in Azure Portal (Entra ID) with platform SPA redirect URI: <code className="bg-slate-200 px-1 rounded">{window.location.origin}</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONNECT APEX CONSULTING WORK */}
          {activeTab === 'apex' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-xs">
                    Apex Consulting Work Email (Custom IMAP / SMTP)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-snug">
                  Access your work mailbox (<code className="bg-emerald-100/70 px-1 rounded font-semibold text-emerald-900">raj@apexadvisory.io</code>) with SSL IMAP sync and authenticated SMTP dispatch.
                </p>
              </div>

              <form onSubmit={handleConnectApex} className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Work Email Address:
                    </label>
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="raj@apexadvisory.io"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Account Password / App Token:
                    </label>
                    <input
                      type="password"
                      value={workPass}
                      onChange={(e) => setWorkPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Incoming IMAP Server:
                    </label>
                    <input
                      type="text"
                      value={workImap}
                      onChange={(e) => setWorkImap(e.target.value)}
                      placeholder="mail.apexadvisory.io"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Outgoing SMTP Server:
                    </label>
                    <input
                      type="text"
                      value={workSmtp}
                      onChange={(e) => setWorkSmtp(e.target.value)}
                      placeholder="smtp.apexadvisory.io"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConnectingWork || !workEmail}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  {isConnectingWork ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying IMAP/SMTP Gateway...</span>
                    </>
                  ) : workSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Connected Successfully!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Link Apex Consulting Mailbox</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
                <span className="font-bold text-red-950 text-xs">
                  Google Gmail (Google Workspace OAuth 2.0)
                </span>
                <p className="text-[11px] text-red-900/80 leading-snug">
                  Uses Google OAuth 2.0 with the official Google Identity Services popup flow.
                </p>
              </div>

              {currentUser ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signed In: {currentUser.email}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Live messages and threads are currently syncing from your real Google account.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-center">
                  <p className="text-slate-600">
                    Connect your personal or Google Workspace email address:
                  </p>
                  <button
                    onClick={onGoogleSignIn}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center justify-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            {accounts.length} accounts configured in your combined view
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
