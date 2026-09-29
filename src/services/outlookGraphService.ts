import { EmailThread, EmailMessage } from '../types';

export interface MicrosoftUserProfile {
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  id: string;
}

export async function fetchOutlookProfile(accessToken: string): Promise<MicrosoftUserProfile> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load Microsoft profile (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function fetchOutlookRealThreads(
  accessToken: string,
  maxResults = 12
): Promise<EmailThread[]> {
  const query = `$top=${maxResults}&$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,receivedDateTime,hasAttachments,isRead,importance&$orderby=receivedDateTime%20desc`;
  const url = `https://graph.microsoft.com/v1.0/me/messages?${query}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to fetch Outlook messages from Microsoft Graph (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const rawMessages: any[] = data.value || [];

  if (rawMessages.length === 0) return [];

  // Group messages by conversationId if multiple belong to the same conversation
  const conversationsMap = new Map<string, any[]>();
  for (const msg of rawMessages) {
    const convId = msg.conversationId || msg.id;
    if (!conversationsMap.has(convId)) {
      conversationsMap.set(convId, []);
    }
    conversationsMap.get(convId)!.push(msg);
  }

  const mappedThreads: EmailThread[] = [];

  for (const [convId, msgs] of conversationsMap.entries()) {
    // Sort chronological ascending
    msgs.sort((a, b) => new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime());

    const firstMsg = msgs[0];
    const latestMsg = msgs[msgs.length - 1];

    const subject = latestMsg.subject || firstMsg.subject || '(No Subject)';
    const fromName = latestMsg.from?.emailAddress?.name || latestMsg.from?.emailAddress?.address || 'Unknown Sender';
    const fromEmail = latestMsg.from?.emailAddress?.address || '';

    // Date formatting
    let formattedDate = 'Recent';
    try {
      const d = new Date(latestMsg.receivedDateTime);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
          formattedDate = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          formattedDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      }
    } catch {}

    const isUnread = msgs.some((m) => !m.isRead);
    const isUrgent = msgs.some((m) => m.importance === 'high');

    const parsedMessages: EmailMessage[] = msgs.map((m: any, idx: number) => {
      let bodyText = m.bodyPreview || '';
      if (m.body?.content) {
        if (m.body.contentType === 'text') {
          bodyText = m.body.content;
        } else {
          // HTML content: strip tags cleanly
          bodyText = m.body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }

      const senderName = m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unknown';
      const senderAddr = m.from?.emailAddress?.address || '';
      const toRecipients = (m.toRecipients || [])
        .map((r: any) => r.emailAddress?.address || r.emailAddress?.name)
        .join(', ');

      return {
        id: `ms-msg-${m.id}`,
        sender: senderName,
        senderEmail: senderAddr,
        recipient: toRecipients || 'You',
        date: new Date(m.receivedDateTime).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        body: bodyText,
        attachments: m.hasAttachments
          ? [{ name: 'Outlook_Attachment.pdf', size: '1.2 MB', type: 'document' }]
          : undefined,
      };
    });

    mappedThreads.push({
      id: `live-outlook-${convId}`,
      accountId: 'acc-real-outlook',
      accountType: 'outlook',
      accountName: 'Real Live Outlook',
      subject: subject,
      snippet: latestMsg.bodyPreview || parsedMessages[parsedMessages.length - 1]?.body?.slice(0, 120) || '',
      unread: isUnread,
      starred: isUrgent,
      priority: isUrgent ? 'high' : isUnread ? 'medium' : 'low',
      category: 'work',
      tags: ['Live Outlook 365', 'MS Graph API'],
      date: formattedDate,
      messages: parsedMessages,
    });
  }

  return mappedThreads;
}

export async function sendOutlookRealMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean }> {
  const payload = {
    message: {
      subject: subject,
      body: {
        contentType: 'Text',
        content: bodyText,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
    saveToSentItems: 'true',
  };

  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok && res.status !== 202) {
    const errorText = await res.text();
    throw new Error(`Microsoft Graph sendMail failed (${res.status}): ${errorText}`);
  }

  return { success: true };
}
