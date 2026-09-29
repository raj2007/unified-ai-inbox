export type AccountType = 'gmail' | 'outlook' | 'work' | 'custom';

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  type: AccountType;
  color: string;
  unreadCount: number;
  status: 'connected' | 'syncing' | 'error';
  lastSynced: string;
  avatar?: string;
}

export interface EmailAttachment {
  name: string;
  size: string;
  type: string;
}

export interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  date: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  accountId: string;
  accountType: AccountType;
  accountName: string;
  subject: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'work' | 'client' | 'finance' | 'onboarding' | 'general';
  tags: string[];
  date: string;
  messages: EmailMessage[];
  hasDraft?: boolean;
  summary?: {
    executiveSummary: string;
    keyTakeaways: string[];
    deadlines: Array<{ item: string; date: string; urgency: 'high' | 'medium' | 'low' }>;
    actionItems: Array<{ id: string; task: string; assignee: string; completed: boolean }>;
    sentiment: 'positive' | 'neutral' | 'urgent' | 'cautious';
    verificationQuotes?: Array<{ claim: string; originalQuote: string }>;
  };
}

export interface ToneOption {
  id: string;
  label: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  briefPrompt: string;
  defaultTone: string;
}

export interface ReviewSuggestion {
  type: 'grammar' | 'tone' | 'conciseness' | 'clarity';
  originalPhrase: string;
  suggestedFix: string;
  reason: string;
}

export interface ReviewResult {
  improvedDraft: string;
  toneRating: string;
  clarityScore: number;
  toneSummary: string;
  suggestions: ReviewSuggestion[];
}

export interface DailyDigestData {
  greeting: string;
  urgencyLevel: 'high' | 'moderate' | 'calm';
  urgentAttention: Array<{
    emailId?: string;
    account: string;
    reason: string;
    suggestedAction: string;
  }>;
  upcomingDeadlinesToday: Array<{
    task: string;
    time: string;
    account: string;
  }>;
  accountBreakdowns: Array<{
    account: string;
    summary: string;
    keyCount: string;
  }>;
  productivityTip: string;
}

export interface WorksheetTask {
  id: string;
  goalId: string;
  goalTitle: string;
  task: string;
  howAiHelps: string;
  timeSpent: 'Low' | 'Medium' | 'High';
  frequency: 'Low' | 'Medium' | 'High';
  repetitiveness: 'Low' | 'Medium' | 'High';
  isCandidateForApp: boolean;
  implementedFeature: string;
  actionKey: string;
}
