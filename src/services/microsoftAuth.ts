import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  AccountInfo,
  InteractionRequiredAuthError,
  AuthenticationResult,
} from '@azure/msal-browser';

// Microsoft Graph Scopes required for reading & sending emails
export const MICROSOFT_GRAPH_SCOPES = [
  'User.Read',
  'Mail.Read',
  'Mail.Send',
  'Mail.ReadWrite',
  'offline_access',
];

// Default public client ID for Microsoft 365 or custom Azure registered client
const DEFAULT_MICROSOFT_CLIENT_ID = 'ea5a67f6-b6f3-4338-b240-c655ddc3cc8e'; // Standard Microsoft multi-tenant client or custom client ID

let msalInstance: PublicClientApplication | null = null;
let activeMsalConfigKey = '';

export function getMsalConfiguration(clientId?: string, tenantId?: string): Configuration {
  const effectiveClientId =
    clientId ||
    localStorage.getItem('omnimail_ms_client_id') ||
    DEFAULT_MICROSOFT_CLIENT_ID;

  const authority = tenantId
    ? `https://login.microsoftonline.com/${tenantId}`
    : 'https://login.microsoftonline.com/common';

  return {
    auth: {
      clientId: effectiveClientId,
      authority: authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage', // Secure session-based cache
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          if (level === LogLevel.Error) {
            console.error('[MSAL Error]:', message);
          }
        },
        logLevel: LogLevel.Warning,
      },
    },
  };
}

export async function getOrCreateMsalInstance(customClientId?: string, tenantId?: string): Promise<PublicClientApplication> {
  const configKey = `${customClientId || 'default'}_${tenantId || 'common'}`;
  
  if (msalInstance && activeMsalConfigKey === configKey) {
    return msalInstance;
  }

  const config = getMsalConfiguration(customClientId, tenantId);
  msalInstance = new PublicClientApplication(config);
  await msalInstance.initialize();
  activeMsalConfigKey = configKey;
  return msalInstance;
}

export async function loginWithMicrosoft(
  customClientId?: string,
  tenantId?: string
): Promise<{ account: AccountInfo; accessToken: string }> {
  if (customClientId) {
    localStorage.setItem('omnimail_ms_client_id', customClientId);
  }

  const msal = await getOrCreateMsalInstance(customClientId, tenantId);

  // Popup-based PKCE OAuth flow for iframe compatibility
  const loginRequest = {
    scopes: MICROSOFT_GRAPH_SCOPES,
    prompt: 'select_account',
  };

  const response: AuthenticationResult = await msal.loginPopup(loginRequest);
  
  if (!response.account) {
    throw new Error('No Microsoft account returned from popup login.');
  }

  msal.setActiveAccount(response.account);

  // Acquire Graph API access token
  let token = response.accessToken;
  if (!token) {
    token = await getMicrosoftAccessToken(response.account);
  }

  return {
    account: response.account,
    accessToken: token,
  };
}

export async function getMicrosoftAccessToken(targetAccount?: AccountInfo | null): Promise<string> {
  const msal = await getOrCreateMsalInstance();
  const account = targetAccount || msal.getActiveAccount() || msal.getAllAccounts()[0];

  if (!account) {
    throw new Error('No active Microsoft account session.');
  }

  try {
    // Attempt silent token acquisition from cache or refresh token
    const tokenResponse = await msal.acquireTokenSilent({
      scopes: MICROSOFT_GRAPH_SCOPES,
      account: account,
    });
    return tokenResponse.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Fallback to interactive popup if token expired or admin consent required
      const tokenResponse = await msal.acquireTokenPopup({
        scopes: MICROSOFT_GRAPH_SCOPES,
        account: account,
      });
      return tokenResponse.accessToken;
    }
    throw error;
  }
}

export async function logoutMicrosoft(): Promise<void> {
  try {
    const msal = await getOrCreateMsalInstance();
    const account = msal.getActiveAccount() || msal.getAllAccounts()[0];
    if (account) {
      await msal.logoutPopup({
        account: account,
      });
    }
  } catch (e) {
    console.warn('MSAL logout note:', e);
  }
}

export async function getActiveMicrosoftAccount(): Promise<AccountInfo | null> {
  try {
    const msal = await getOrCreateMsalInstance();
    return msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
  } catch {
    return null;
  }
}
