// ============================================================================
// Gmail Service
// ============================================================================
// Handles Gmail API operations for CRM email integration
// Sprint 8 Track C - Gmail Integration
//
// Environment Variables Required:
// - GOOGLE_CLIENT_ID: Google OAuth client ID
// - GOOGLE_CLIENT_SECRET: Google OAuth client secret
//
// OAuth Scopes Used:
// - https://www.googleapis.com/auth/gmail.readonly (read emails)
// - https://www.googleapis.com/auth/gmail.send (send emails)
// - https://www.googleapis.com/auth/gmail.modify (modify labels, mark read)
// ============================================================================

import { google, gmail_v1 } from 'googleapis';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Gmail API OAuth scopes required for CRM integration */
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

/** Maximum results per API request (Gmail API limit is 500) */
const DEFAULT_MAX_RESULTS = 100;

/** Gmail push notification topic name */
const PUBSUB_TOPIC = 'projects/spac-os/topics/gmail-push';

// ============================================================================
// TYPES
// ============================================================================

/**
 * OAuth token response from Google
 */
export interface TokenResponse {
  /** Access token for API requests */
  accessToken: string;
  /** Refresh token for obtaining new access tokens (only on initial auth) */
  refreshToken?: string;
  /** Timestamp when the access token expires */
  expiresAt: Date;
  /** Scopes granted by the user */
  scope: string;
}

/**
 * Options for inbox sync operation
 */
export interface SyncOptions {
  /** History ID for incremental sync. If not provided, performs full sync */
  historyId?: string;
  /** Maximum number of messages to fetch (default: 100, max: 500) */
  maxResults?: number;
  /** Label IDs to filter messages (e.g., ['INBOX', 'UNREAD']) */
  labelIds?: string[];
}

/**
 * Result of inbox sync operation
 */
export interface SyncResult {
  /** Array of synced email data */
  emails: EmailData[];
  /** New history ID for next incremental sync */
  newHistoryId: string;
  /** Whether there are more messages to sync */
  hasMore: boolean;
}

/**
 * Email data structure from Gmail
 */
export interface EmailData {
  /** Gmail message ID */
  id: string;
  /** Gmail thread ID */
  threadId: string;
  /** Email subject */
  subject: string;
  /** Email body (HTML or plain text) */
  body: string;
  /** Short snippet of the email content */
  snippet: string;
  /** Sender email address */
  from: string;
  /** Sender display name */
  fromName?: string;
  /** Array of recipient email addresses */
  to: string[];
  /** Array of CC recipient email addresses */
  cc: string[];
  /** Array of BCC recipient email addresses (only for sent emails) */
  bcc: string[];
  /** Email date */
  date: Date;
  /** Whether the email has been read */
  isRead: boolean;
  /** Whether the email is starred */
  isStarred: boolean;
  /** Gmail labels on the message */
  labels: string[];
  /** Message headers for threading (In-Reply-To, References) */
  headers?: {
    messageId?: string;
    inReplyTo?: string;
    references?: string;
  };
}

/**
 * Gmail thread summary
 */
export interface Thread {
  /** Gmail thread ID */
  id: string;
  /** Thread snippet */
  snippet: string;
  /** History ID */
  historyId: string;
  /** Number of messages in thread */
  messagesCount?: number;
}

/**
 * Full thread with all messages
 */
export interface FullThread {
  /** Gmail thread ID */
  id: string;
  /** History ID */
  historyId: string;
  /** All messages in the thread */
  messages: EmailData[];
}

/**
 * Gmail user profile
 */
export interface GmailProfile {
  /** User's email address */
  emailAddress: string;
  /** Number of messages in mailbox */
  messagesTotal: number;
  /** Number of threads in mailbox */
  threadsTotal: number;
  /** Current history ID */
  historyId: string;
}

/**
 * Payload for sending a new email
 */
export interface EmailPayload {
  /** Array of recipient email addresses */
  to: string[];
  /** Array of CC recipient email addresses */
  cc?: string[];
  /** Array of BCC recipient email addresses */
  bcc?: string[];
  /** Email subject */
  subject: string;
  /** Email body content */
  body: string;
  /** Whether the body is HTML (default: false for plain text) */
  isHtml?: boolean;
}

/**
 * Payload for replying to a thread
 */
export interface ReplyPayload {
  /** Reply body content */
  body: string;
  /** Whether to reply to all recipients (default: false) */
  replyAll?: boolean;
  /** Whether the body is HTML (default: false for plain text) */
  isHtml?: boolean;
}

/**
 * Response from sending an email
 */
export interface SentMessage {
  /** Gmail message ID */
  id: string;
  /** Gmail thread ID */
  threadId: string;
  /** Labels on the sent message */
  labels: string[];
}

/**
 * Push notification payload from Gmail
 */
export interface PushPayload {
  /** Email address of the mailbox */
  emailAddress: string;
  /** History ID at the time of the notification */
  historyId: string;
}

/**
 * Watch response from Gmail push notifications
 */
export interface WatchResponse {
  /** History ID at the time of setup */
  historyId: string;
  /** Expiration time of the watch */
  expiration: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Gmail service error codes
 */
export enum GmailErrorCode {
  /** Invalid or expired access token */
  INVALID_TOKEN = 'INVALID_TOKEN',
  /** Token refresh failed */
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  /** Rate limit exceeded */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Message not found */
  NOT_FOUND = 'NOT_FOUND',
  /** Invalid request parameters */
  INVALID_REQUEST = 'INVALID_REQUEST',
  /** Gmail API error */
  API_ERROR = 'API_ERROR',
  /** Network error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Configuration error (missing env vars) */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** Insufficient permissions */
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  /** History ID expired (full sync required) */
  HISTORY_EXPIRED = 'HISTORY_EXPIRED',
}

/**
 * Custom error class for Gmail service errors
 */
export class GmailServiceError extends Error {
  constructor(
    message: string,
    public readonly code: GmailErrorCode,
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'GmailServiceError';
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get OAuth2 client configured with credentials
 * @internal
 */
function getOAuth2Client(redirectUri?: string) {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new GmailServiceError(
      'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      GmailErrorCode.CONFIG_ERROR
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Create Gmail client with access token
 * @internal
 */
function getGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Parse email address from header format "Name <email@example.com>"
 * @internal
 */
function parseEmailAddress(header: string): { email: string; name?: string } {
  const match = header.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2]?.trim() || header.trim(),
    };
  }
  return { email: header.trim() };
}

/**
 * Parse multiple email addresses from header
 * @internal
 */
function parseEmailAddresses(header: string | undefined): string[] {
  if (!header) { return []; }
  return header.split(',').map((addr) => parseEmailAddress(addr.trim()).email);
}

/**
 * Get header value from message headers
 * @internal
 */
function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | undefined {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || undefined;
}

/**
 * Decode base64url encoded string
 * @internal
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Encode string to base64url
 * @internal
 */
function encodeBase64Url(data: string): string {
  return Buffer.from(data, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Extract email body from message parts
 * @internal
 */
function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) { return ''; }

  // Check for direct body data
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Check parts recursively
  if (payload.parts) {
    // Prefer HTML over plain text
    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return decodeBase64Url(htmlPart.body.data);
    }

    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    // Check nested parts (multipart/alternative, etc.)
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) { return body; }
    }
  }

  return '';
}

/**
 * Convert Gmail message to EmailData
 * @internal
 */
function messageToEmailData(message: gmail_v1.Schema$Message): EmailData {
  const headers = message.payload?.headers;
  const fromHeader = getHeader(headers, 'From') || '';
  const parsed = parseEmailAddress(fromHeader);

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    body: extractBody(message.payload),
    snippet: message.snippet || '',
    from: parsed.email,
    fromName: parsed.name,
    to: parseEmailAddresses(getHeader(headers, 'To')),
    cc: parseEmailAddresses(getHeader(headers, 'Cc')),
    bcc: parseEmailAddresses(getHeader(headers, 'Bcc')),
    date: new Date(parseInt(message.internalDate || '0', 10)),
    isRead: !message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED') || false,
    labels: message.labelIds || [],
    headers: {
      messageId: getHeader(headers, 'Message-ID'),
      inReplyTo: getHeader(headers, 'In-Reply-To'),
      references: getHeader(headers, 'References'),
    },
  };
}

/**
 * Build RFC 2822 formatted email message
 * @internal
 */
function buildRawEmail(
  from: string,
  to: string[],
  subject: string,
  body: string,
  options?: {
    cc?: string[];
    bcc?: string[];
    isHtml?: boolean;
    inReplyTo?: string;
    references?: string;
    threadId?: string;
  }
): string {
  const boundary = `boundary_${Date.now()}`;
  const contentType = options?.isHtml ? 'text/html' : 'text/plain';

  const headers = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
    options?.cc?.length ? `Cc: ${options.cc.join(', ')}` : null,
    options?.bcc?.length ? `Bcc: ${options.bcc.join(', ')}` : null,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${contentType}; charset="UTF-8"`,
    options?.inReplyTo ? `In-Reply-To: ${options.inReplyTo}` : null,
    options?.references ? `References: ${options.references}` : null,
  ]
    .filter(Boolean)
    .join('\r\n');

  return `${headers}\r\n\r\n${body}`;
}

/**
 * Handle Gmail API errors and convert to GmailServiceError
 * @internal
 */
function handleApiError(error: unknown): never {
  if (error instanceof GmailServiceError) {
    throw error;
  }

  // Handle Google API errors
  const apiError = error as {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string }>;
  };

  const statusCode = apiError.code;
  const message = apiError.message || 'Unknown Gmail API error';
  const reason = apiError.errors?.[0]?.reason;

  // Map status codes and reasons to error codes
  if (statusCode === 401) {
    throw new GmailServiceError(
      'Invalid or expired access token',
      GmailErrorCode.INVALID_TOKEN,
      401
    );
  }

  if (statusCode === 403) {
    if (reason === 'insufficientPermissions') {
      throw new GmailServiceError(
        'Insufficient permissions. User may need to re-authorize with required scopes.',
        GmailErrorCode.INSUFFICIENT_SCOPE,
        403
      );
    }
    throw new GmailServiceError(message, GmailErrorCode.API_ERROR, 403);
  }

  if (statusCode === 404) {
    throw new GmailServiceError('Resource not found', GmailErrorCode.NOT_FOUND, 404);
  }

  if (statusCode === 429) {
    // Extract retry-after if available
    throw new GmailServiceError(
      'Rate limit exceeded. Please retry later.',
      GmailErrorCode.RATE_LIMITED,
      429
    );
  }

  if (statusCode === 410 && reason === 'historyIdExpired') {
    throw new GmailServiceError(
      'History ID expired. A full sync is required.',
      GmailErrorCode.HISTORY_EXPIRED,
      410
    );
  }

  if (statusCode && statusCode >= 500) {
    throw new GmailServiceError(
      'Gmail service temporarily unavailable',
      GmailErrorCode.API_ERROR,
      statusCode
    );
  }

  // Network errors
  if ((error as Error).message?.includes('ECONNREFUSED') || (error as Error).message?.includes('ETIMEDOUT')) {
    throw new GmailServiceError(
      'Network error connecting to Gmail API',
      GmailErrorCode.NETWORK_ERROR
    );
  }

  throw new GmailServiceError(message, GmailErrorCode.API_ERROR, statusCode);
}

// ============================================================================
// CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Generate Google OAuth URL for Gmail authorization
 *
 * @param redirectUri - The URI to redirect to after authorization
 * @returns OAuth authorization URL that user should be redirected to
 *
 * @example
 * ```typescript
 * const authUrl = getGmailAuthUrl('https://myapp.com/api/auth/gmail/callback');
 * // Redirect user to authUrl
 * ```
 */
export function getGmailAuthUrl(redirectUri: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    scope: GMAIL_SCOPES,
  });
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Exchange authorization code for access and refresh tokens
 *
 * @param code - Authorization code from OAuth callback
 * @param redirectUri - Same redirect URI used in getGmailAuthUrl
 * @returns Token response with access token, refresh token, and expiration
 *
 * @throws {GmailServiceError} If code exchange fails
 *
 * @example
 * ```typescript
 * const tokens = await exchangeCodeForTokens(code, redirectUri);
 * // Store tokens.refreshToken securely for later use
 * ```
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  try {
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new GmailServiceError(
        'No access token received from Google',
        GmailErrorCode.INVALID_TOKEN
      );
    }

    // Calculate expiration time (tokens.expiry_date is in milliseconds)
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt,
      scope: tokens.scope || GMAIL_SCOPES.join(' '),
    };
  } catch (error) {
    if (error instanceof GmailServiceError) { throw error; }
    throw new GmailServiceError(
      `Failed to exchange authorization code: ${(error as Error).message}`,
      GmailErrorCode.TOKEN_REFRESH_FAILED
    );
  }
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token from initial authorization
 * @returns New token response with fresh access token
 *
 * @throws {GmailServiceError} If token refresh fails
 *
 * @example
 * ```typescript
 * const newTokens = await refreshAccessToken(storedRefreshToken);
 * // Update stored access token
 * ```
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new GmailServiceError(
        'No access token received during refresh',
        GmailErrorCode.TOKEN_REFRESH_FAILED
      );
    }

    const expiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Keep original if not returned
      expiresAt,
      scope: credentials.scope || GMAIL_SCOPES.join(' '),
    };
  } catch (error) {
    if (error instanceof GmailServiceError) { throw error; }
    throw new GmailServiceError(
      `Failed to refresh access token: ${(error as Error).message}`,
      GmailErrorCode.TOKEN_REFRESH_FAILED
    );
  }
}

/**
 * Revoke OAuth tokens (for disconnect functionality)
 *
 * @param accessToken - Access token to revoke
 *
 * @throws {GmailServiceError} If revocation fails
 */
export async function revokeToken(accessToken: string): Promise<void> {
  try {
    const oauth2Client = getOAuth2Client();
    await oauth2Client.revokeToken(accessToken);
  } catch (error) {
    // Ignore errors - token may already be invalid
    console.warn('Token revocation failed (may already be invalid):', (error as Error).message);
  }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync inbox messages from Gmail
 *
 * Performs either a full sync or incremental sync based on whether historyId is provided.
 * - Full sync: Fetches recent messages from the inbox
 * - Incremental sync: Fetches only changes since the last historyId
 *
 * @param accessToken - Valid Gmail access token
 * @param options - Sync options including historyId for incremental sync
 * @returns Sync result with emails, new history ID, and pagination info
 *
 * @throws {GmailServiceError} If sync fails or history ID expired
 *
 * @example
 * ```typescript
 * // Full sync (first time)
 * const result = await syncInbox(accessToken, { maxResults: 100 });
 *
 * // Incremental sync (subsequent)
 * const result = await syncInbox(accessToken, {
 *   historyId: previousHistoryId,
 *   maxResults: 50
 * });
 * ```
 */
export async function syncInbox(
  accessToken: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const gmail = getGmailClient(accessToken);
  const maxResults = Math.min(options.maxResults || DEFAULT_MAX_RESULTS, 500);
  const labelIds = options.labelIds || ['INBOX'];

  try {
    // If historyId provided, do incremental sync
    if (options.historyId) {
      return await performIncrementalSync(gmail, options.historyId, maxResults, labelIds);
    }

    // Otherwise, do full sync
    return await performFullSync(gmail, maxResults, labelIds);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Perform full inbox sync
 * @internal
 */
async function performFullSync(
  gmail: gmail_v1.Gmail,
  maxResults: number,
  labelIds: string[]
): Promise<SyncResult> {
  // Get message list
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds,
  });

  const messageIds = listResponse.data.messages || [];
  const emails: EmailData[] = [];

  // Fetch full message details (batch in groups of 100)
  for (let i = 0; i < messageIds.length; i += 100) {
    const batch = messageIds.slice(i, i + 100);
    const batchPromises = batch.map((msg) =>
      gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })
    );

    const batchResults = await Promise.all(batchPromises);
    for (const result of batchResults) {
      if (result.data) {
        emails.push(messageToEmailData(result.data));
      }
    }
  }

  // Get current history ID from profile
  const profile = await gmail.users.getProfile({ userId: 'me' });

  return {
    emails,
    newHistoryId: profile.data.historyId || '',
    hasMore: !!listResponse.data.nextPageToken,
  };
}

/**
 * Perform incremental sync using history API
 * @internal
 */
async function performIncrementalSync(
  gmail: gmail_v1.Gmail,
  historyId: string,
  maxResults: number,
  labelIds: string[]
): Promise<SyncResult> {
  const emails: EmailData[] = [];
  const processedIds = new Set<string>();

  // Get history changes since last sync
  const historyResponse = await gmail.users.history.list({
    userId: 'me',
    startHistoryId: historyId,
    maxResults,
    labelId: labelIds[0], // History API only supports single label
    historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
  });

  const history = historyResponse.data.history || [];

  // Collect all message IDs that need to be fetched
  const messageIdsToFetch = new Set<string>();
  for (const record of history) {
    // Messages added to mailbox
    if (record.messagesAdded) {
      for (const added of record.messagesAdded) {
        if (added.message?.id) {
          messageIdsToFetch.add(added.message.id);
        }
      }
    }
    // Labels changed (might affect our view)
    if (record.labelsAdded) {
      for (const labeled of record.labelsAdded) {
        if (labeled.message?.id) {
          messageIdsToFetch.add(labeled.message.id);
        }
      }
    }
    if (record.labelsRemoved) {
      for (const unlabeled of record.labelsRemoved) {
        if (unlabeled.message?.id) {
          messageIdsToFetch.add(unlabeled.message.id);
        }
      }
    }
  }

  // Fetch full message details
  for (const msgId of messageIdsToFetch) {
    if (processedIds.has(msgId)) { continue; }
    processedIds.add(msgId);

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: msgId,
        format: 'full',
      });

      if (response.data) {
        emails.push(messageToEmailData(response.data));
      }
    } catch (error) {
      // Message may have been deleted, skip it
      console.warn(`Failed to fetch message ${msgId}:`, (error as Error).message);
    }
  }

  return {
    emails,
    newHistoryId: historyResponse.data.historyId || historyId,
    hasMore: !!historyResponse.data.nextPageToken,
  };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Fetch thread summaries matching a search query
 *
 * @param accessToken - Valid Gmail access token
 * @param query - Gmail search query (e.g., "from:user@example.com", "subject:hello")
 * @param maxResults - Maximum threads to return (default: 20, max: 500)
 * @returns Array of thread summaries
 *
 * @throws {GmailServiceError} If fetch fails
 *
 * @example
 * ```typescript
 * // Search for threads from a specific sender
 * const threads = await fetchThreads(accessToken, 'from:client@company.com', 50);
 *
 * // Search for unread threads
 * const unread = await fetchThreads(accessToken, 'is:unread');
 * ```
 */
export async function fetchThreads(
  accessToken: string,
  query: string,
  maxResults: number = 20
): Promise<Thread[]> {
  const gmail = getGmailClient(accessToken);

  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(maxResults, 500),
    });

    return (response.data.threads || []).map((thread) => ({
      id: thread.id || '',
      snippet: thread.snippet || '',
      historyId: thread.historyId || '',
      messagesCount: undefined, // Not available in list response
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fetch a complete thread with all messages
 *
 * @param accessToken - Valid Gmail access token
 * @param threadId - Gmail thread ID
 * @returns Full thread with all messages
 *
 * @throws {GmailServiceError} If thread not found or fetch fails
 *
 * @example
 * ```typescript
 * const thread = await fetchThread(accessToken, threadId);
 * for (const message of thread.messages) {
 *   console.log(`${message.from}: ${message.subject}`);
 * }
 * ```
 */
export async function fetchThread(
  accessToken: string,
  threadId: string
): Promise<FullThread> {
  const gmail = getGmailClient(accessToken);

  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const messages = (response.data.messages || []).map(messageToEmailData);

    return {
      id: response.data.id || threadId,
      historyId: response.data.historyId || '',
      messages,
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get Gmail user profile
 *
 * @param accessToken - Valid Gmail access token
 * @returns Gmail profile with email address and mailbox statistics
 *
 * @throws {GmailServiceError} If fetch fails
 *
 * @example
 * ```typescript
 * const profile = await getProfile(accessToken);
 * console.log(`Connected as: ${profile.emailAddress}`);
 * ```
 */
export async function getProfile(accessToken: string): Promise<GmailProfile> {
  const gmail = getGmailClient(accessToken);

  try {
    const response = await gmail.users.getProfile({ userId: 'me' });

    return {
      emailAddress: response.data.emailAddress || '',
      messagesTotal: response.data.messagesTotal || 0,
      threadsTotal: response.data.threadsTotal || 0,
      historyId: response.data.historyId || '',
    };
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================================
// SEND OPERATIONS
// ============================================================================

/**
 * Send a new email
 *
 * @param accessToken - Valid Gmail access token
 * @param email - Email payload with recipients, subject, and body
 * @returns Sent message info with ID and thread ID
 *
 * @throws {GmailServiceError} If send fails
 *
 * @example
 * ```typescript
 * const sent = await sendEmail(accessToken, {
 *   to: ['recipient@example.com'],
 *   cc: ['cc@example.com'],
 *   subject: 'Hello from SPAC OS',
 *   body: 'This is the email body.',
 *   isHtml: false
 * });
 * console.log(`Sent message ID: ${sent.id}`);
 * ```
 */
export async function sendEmail(
  accessToken: string,
  email: EmailPayload
): Promise<SentMessage> {
  const gmail = getGmailClient(accessToken);

  try {
    // Get sender's email from profile
    const profile = await getProfile(accessToken);
    const fromEmail = profile.emailAddress;

    // Build raw email message
    const rawMessage = buildRawEmail(fromEmail, email.to, email.subject, email.body, {
      cc: email.cc,
      bcc: email.bcc,
      isHtml: email.isHtml,
    });

    // Send the message
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeBase64Url(rawMessage),
      },
    });

    return {
      id: response.data.id || '',
      threadId: response.data.threadId || '',
      labels: response.data.labelIds || ['SENT'],
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Reply to an existing email thread
 *
 * @param accessToken - Valid Gmail access token
 * @param threadId - Gmail thread ID to reply to
 * @param reply - Reply payload with body and replyAll flag
 * @returns Sent message info with ID and thread ID
 *
 * @throws {GmailServiceError} If thread not found or send fails
 *
 * @example
 * ```typescript
 * const reply = await replyToThread(accessToken, threadId, {
 *   body: 'Thanks for your message!',
 *   replyAll: true
 * });
 * ```
 */
export async function replyToThread(
  accessToken: string,
  threadId: string,
  reply: ReplyPayload
): Promise<SentMessage> {
  const gmail = getGmailClient(accessToken);

  try {
    // Fetch the thread to get the last message for reply headers
    const thread = await fetchThread(accessToken, threadId);
    if (thread.messages.length === 0) {
      throw new GmailServiceError(
        'Cannot reply to empty thread',
        GmailErrorCode.INVALID_REQUEST
      );
    }

    const lastMessage = thread.messages[thread.messages.length - 1];
    if (!lastMessage) {
      throw new GmailServiceError(
        'Cannot find last message in thread',
        GmailErrorCode.NOT_FOUND
      );
    }

    // Get sender's email
    const profile = await getProfile(accessToken);
    const fromEmail = profile.emailAddress;

    // Determine recipients
    let toRecipients: string[];
    let ccRecipients: string[] = [];

    if (reply.replyAll) {
      // Reply all: include sender and all recipients (except self)
      const allRecipients = new Set([lastMessage.from, ...lastMessage.to, ...lastMessage.cc]);
      allRecipients.delete(fromEmail);
      toRecipients = Array.from(allRecipients);
    } else {
      // Simple reply: just to the sender
      toRecipients = [lastMessage.from];
    }

    // Build subject with Re: prefix if needed
    const subject = lastMessage.subject.startsWith('Re:')
      ? lastMessage.subject
      : `Re: ${lastMessage.subject}`;

    // Build reply message with threading headers
    const rawMessage = buildRawEmail(fromEmail, toRecipients, subject, reply.body, {
      cc: reply.replyAll ? lastMessage.cc.filter((e) => e !== fromEmail) : undefined,
      isHtml: reply.isHtml,
      inReplyTo: lastMessage.headers?.messageId,
      references: lastMessage.headers?.references
        ? `${lastMessage.headers.references} ${lastMessage.headers.messageId}`
        : lastMessage.headers?.messageId,
    });

    // Send the reply
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeBase64Url(rawMessage),
        threadId, // Associate with the thread
      },
    });

    return {
      id: response.data.id || '',
      threadId: response.data.threadId || threadId,
      labels: response.data.labelIds || ['SENT'],
    };
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================================
// LABEL OPERATIONS
// ============================================================================

/**
 * Modify labels on a message (mark read/unread, star/unstar, etc.)
 *
 * @param accessToken - Valid Gmail access token
 * @param messageId - Gmail message ID
 * @param addLabels - Labels to add
 * @param removeLabels - Labels to remove
 *
 * @throws {GmailServiceError} If modification fails
 *
 * @example
 * ```typescript
 * // Mark as read
 * await modifyLabels(accessToken, messageId, [], ['UNREAD']);
 *
 * // Star a message
 * await modifyLabels(accessToken, messageId, ['STARRED'], []);
 * ```
 */
export async function modifyLabels(
  accessToken: string,
  messageId: string,
  addLabels: string[],
  removeLabels: string[]
): Promise<void> {
  const gmail = getGmailClient(accessToken);

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Batch modify labels on multiple messages
 *
 * @param accessToken - Valid Gmail access token
 * @param messageIds - Array of Gmail message IDs
 * @param addLabels - Labels to add
 * @param removeLabels - Labels to remove
 *
 * @throws {GmailServiceError} If batch modification fails
 */
export async function batchModifyLabels(
  accessToken: string,
  messageIds: string[],
  addLabels: string[],
  removeLabels: string[]
): Promise<void> {
  const gmail = getGmailClient(accessToken);

  try {
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================================
// WEBHOOK / PUSH NOTIFICATIONS
// ============================================================================

/**
 * Set up push notifications for Gmail changes
 *
 * This sets up a watch on the user's mailbox to receive push notifications
 * when new emails arrive or changes occur. The watch expires after 7 days
 * and must be renewed.
 *
 * @param accessToken - Valid Gmail access token
 * @param webhookUrl - URL to receive push notifications (must be HTTPS)
 *
 * @throws {GmailServiceError} If setup fails
 *
 * @example
 * ```typescript
 * await setupPushNotifications(
 *   accessToken,
 *   'https://myapp.com/api/webhooks/gmail'
 * );
 * ```
 */
export async function setupPushNotifications(
  accessToken: string,
  webhookUrl: string
): Promise<WatchResponse> {
  const gmail = getGmailClient(accessToken);

  try {
    // Note: This requires Cloud Pub/Sub to be set up
    // The topicName should be created in Google Cloud Console
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: PUBSUB_TOPIC,
        labelIds: ['INBOX'],
        labelFilterAction: 'include',
      },
    });

    return {
      historyId: response.data.historyId || '',
      expiration: response.data.expiration || '',
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Stop push notifications for a mailbox
 *
 * @param accessToken - Valid Gmail access token
 *
 * @throws {GmailServiceError} If stop fails
 */
export async function stopPushNotifications(accessToken: string): Promise<void> {
  const gmail = getGmailClient(accessToken);

  try {
    await gmail.users.stop({ userId: 'me' });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Handle incoming push notification from Gmail
 *
 * This should be called when your webhook receives a notification.
 * It decodes the payload and returns the relevant information for
 * triggering an incremental sync.
 *
 * @param payload - Push notification payload from Gmail (base64 encoded)
 * @returns Decoded push payload with email address and history ID
 *
 * @example
 * ```typescript
 * // In your webhook handler:
 * app.post('/api/webhooks/gmail', async (req, res) => {
 *   const data = req.body.message.data;
 *   const payload = await handlePushNotification({ data });
 *
 *   // Trigger incremental sync for the user
 *   await syncInbox(userAccessToken, { historyId: payload.historyId });
 *
 *   res.status(200).send('OK');
 * });
 * ```
 */
export async function handlePushNotification(payload: { data: string }): Promise<PushPayload> {
  try {
    // Decode base64 payload from Pub/Sub
    const decoded = Buffer.from(payload.data, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as {
      emailAddress?: string;
      historyId?: number;
    };

    return {
      emailAddress: parsed.emailAddress || '',
      historyId: String(parsed.historyId || ''),
    };
  } catch (error) {
    throw new GmailServiceError(
      `Failed to parse push notification: ${(error as Error).message}`,
      GmailErrorCode.INVALID_REQUEST
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an access token is valid by making a simple API call
 *
 * @param accessToken - Access token to validate
 * @returns True if token is valid, false otherwise
 */
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    await getProfile(accessToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the Gmail scopes required by this service
 *
 * @returns Array of OAuth scope URLs
 */
export function getRequiredScopes(): string[] {
  return [...GMAIL_SCOPES];
}
