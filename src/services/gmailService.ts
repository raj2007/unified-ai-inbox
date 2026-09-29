import { EmailThread, EmailMessage } from '../types';

function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '';
  }
}

function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    // Look for text/plain first
    const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart?.body?.data) {
      return decodeBase64Url(plainPart.body.data);
    }

    // Fall back to text/html stripped
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      // Basic strip html tags
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Check nested parts
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested) return nested;
    }
  }

  return '';
}

export async function fetchUserGmailProfile(accessToken: string) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load Gmail profile: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchUserGmailThreads(
  accessToken: string,
  maxResults = 12
): Promise<EmailThread[]> {
  // 1. List threads
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=in:inbox`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Failed to list Gmail threads (${listRes.status}): ${errorText}`);
  }

  const listData = await listRes.json();
  const rawThreads = listData.threads || [];
  if (rawThreads.length === 0) return [];

  // 2. Fetch full details for each thread in parallel (up to maxResults)
  const threadPromises = rawThreads.map(async (t: { id: string }) => {
    try {
      const threadRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!threadRes.ok) return null;
      return await threadRes.json();
    } catch {
      return null;
    }
  });

  const fullThreads = (await Promise.all(threadPromises)).filter(Boolean);

  // 3. Map into OmniMail EmailThread format
  const mapped: EmailThread[] = fullThreads.map((threadData: any) => {
    const messages = threadData.messages || [];
    const firstMsg = messages[0] || {};
    const lastMsg = messages[messages.length - 1] || firstMsg;

    const headers = lastMsg.payload?.headers || [];
    const firstHeaders = firstMsg.payload?.headers || [];

    const getHeader = (hdrs: any[], name: string) =>
      hdrs.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader(firstHeaders, 'subject') || '(No Subject)';
    const from = getHeader(headers, 'from') || 'Unknown Sender';
    const dateStr = getHeader(headers, 'date') || 'Recent';

    // Format date nicely
    let formattedDate = dateStr;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
          formattedDate = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          formattedDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      }
    } catch {}

    const isUnread = messages.some((m: any) => m.labelIds?.includes('UNREAD'));
    const isStarred = messages.some((m: any) => m.labelIds?.includes('STARRED'));

    const parsedMessages: EmailMessage[] = messages.map((m: any, idx: number) => {
      const mHeaders = m.payload?.headers || [];
      const mFrom = getHeader(mHeaders, 'from');
      const mTo = getHeader(mHeaders, 'to');
      const mDate = getHeader(mHeaders, 'date');
      const body = extractBodyFromPayload(m.payload) || m.snippet || '';

      const attachments: any[] = [];
      if (m.payload?.parts) {
        for (const p of m.payload.parts) {
          if (p.filename && p.body?.attachmentId) {
            attachments.push({
              name: p.filename,
              size: `${Math.round((p.body.size || 0) / 1024)} KB`,
              type: p.mimeType || 'file',
            });
          }
        }
      }

      return {
        id: m.id || `msg-${threadData.id}-${idx}`,
        sender: mFrom,
        senderEmail: mFrom.match(/<([^>]+)>/)?.[1] || mFrom,
        recipient: mTo,
        date: mDate,
        body: body.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };
    });

    return {
      id: `live-gmail-${threadData.id}`,
      accountId: 'acc-real-gmail',
      accountType: 'gmail',
      accountName: 'Real Live Gmail',
      subject: subject,
      snippet: lastMsg.snippet || parsedMessages[parsedMessages.length - 1]?.body?.slice(0, 120) || '',
      unread: isUnread,
      starred: isStarred,
      priority: isUnread ? 'high' : 'medium',
      category: 'work',
      tags: ['Live Gmail', 'Synchronized'],
      date: formattedDate,
      messages: parsedMessages,
    };
  });

  return mapped;
}

export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string,
  threadId?: string
) {
  // Construct RFC 2822 email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payload: any = { raw: encodedMessage };
  if (threadId && threadId.startsWith('live-gmail-')) {
    payload.threadId = threadId.replace('live-gmail-', '');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to send email via Gmail API (${res.status}): ${errorBody}`);
  }

  return await res.json();
}
