/**
 * SPAC OS - Google Calendar Service
 * Google Calendar API operations for Sprint 8 calendar integration
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Calendar OAuth scopes
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// ============================================================================
// TYPES
// ============================================================================

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
  tokenType: string;
  scope: string;
}

export interface ListEventsOptions {
  timeMin: Date;
  timeMax: Date;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  pageToken?: string;
  q?: string; // Free text search
}

export interface CreateEventPayload {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  reminders?: { useDefault: boolean } | { overrides: Array<{ method: string; minutes: number }> };
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus: string; self?: boolean }>;
  hangoutLink?: string;  // Google Meet link
  htmlLink: string;
  status: string;
  created?: string;
  updated?: string;
  creator?: { email: string; displayName?: string; self?: boolean };
  organizer?: { email: string; displayName?: string; self?: boolean };
  recurringEventId?: string;
  originalStartTime?: { dateTime?: string; date?: string };
  conferenceData?: ConferenceData;
}

export interface CalendarEventWithMeet extends CalendarEvent {
  hangoutLink: string;
  conferenceData: ConferenceData;
}

export interface ConferenceData {
  entryPoints?: Array<{
    entryPointType: string;
    uri: string;
    label?: string;
    pin?: string;
  }>;
  conferenceSolution?: {
    key: { type: string };
    name: string;
    iconUri?: string;
  };
  conferenceId?: string;
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: { type: string };
    status: { statusCode: string };
  };
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  primary?: boolean;
}

export interface ListEventsResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface ListCalendarsResponse {
  calendars: Calendar[];
  nextPageToken?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'GoogleCalendarError';
  }
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Google Calendar API error: ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorBody = await response.json();
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
        errorCode = errorBody.error.code;
      }
    } catch {
      // If we can't parse the error body, use the default message
    }

    throw new GoogleCalendarError(errorMessage, response.status, errorCode);
  }

  // Handle empty responses (like DELETE)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Returns OAuth URL with calendar scopes
 * Scopes: calendar.events, calendar.readonly
 */
export function getCalendarAuthUrl(redirectUri: string): string {
  const clientId = process.env['GOOGLE_CLIENT_ID'];

  if (!clientId) {
    throw new GoogleCalendarError('GOOGLE_CLIENT_ID environment variable is not set');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Exchange authorization code for access and refresh tokens
 * Can be shared with Gmail if using the same Google account
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new GoogleCalendarError(
      'Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)'
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await handleApiResponse<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>(response);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new GoogleCalendarError(
      'Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)'
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await handleApiResponse<{
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>(response);

  return {
    accessToken: data.access_token,
    // Refresh tokens are not returned when refreshing
    refreshToken: refreshToken,
    expiresIn: data.expires_in,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
    { method: 'POST' }
  );

  if (!response.ok && response.status !== 400) {
    // 400 means token was already revoked or invalid
    throw new GoogleCalendarError(
      'Failed to revoke token',
      response.status
    );
  }
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * List all calendars the user has access to
 */
export async function listCalendars(accessToken: string): Promise<Calendar[]> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await handleApiResponse<{
    items: Array<{
      id: string;
      summary: string;
      description?: string;
      timeZone?: string;
      colorId?: string;
      backgroundColor?: string;
      foregroundColor?: string;
      accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
      primary?: boolean;
    }>;
    nextPageToken?: string;
  }>(response);

  return data.items.map((item) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    timeZone: item.timeZone,
    colorId: item.colorId,
    backgroundColor: item.backgroundColor,
    foregroundColor: item.foregroundColor,
    accessRole: item.accessRole,
    primary: item.primary,
  }));
}

/**
 * List events from a calendar
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: ListEventsOptions
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: options.timeMin.toISOString(),
    timeMax: options.timeMax.toISOString(),
    maxResults: String(options.maxResults ?? 250),
    singleEvents: String(options.singleEvents ?? true),
    orderBy: options.orderBy ?? 'startTime',
  });

  if (options.pageToken) {
    params.set('pageToken', options.pageToken);
  }

  if (options.q) {
    params.set('q', options.q);
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await handleApiResponse<{
    items: CalendarEvent[];
    nextPageToken?: string;
    nextSyncToken?: string;
  }>(response);

  return data.items ?? [];
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<CalendarEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return handleApiResponse<CalendarEvent>(response);
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: CreateEventPayload
): Promise<CalendarEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  return handleApiResponse<CalendarEvent>(response);
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  updates: Partial<CreateEventPayload>
): Promise<CalendarEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  return handleApiResponse<CalendarEvent>(response);
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    await handleApiResponse<void>(response);
  }
}

// ============================================================================
// MEET INTEGRATION
// ============================================================================

/**
 * Creates event with Google Meet link auto-generated
 */
export async function createEventWithMeet(
  accessToken: string,
  event: CreateEventPayload
): Promise<CalendarEventWithMeet> {
  // Generate a unique request ID for the conference
  const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const eventWithConference = {
    ...event,
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
  };

  // conferenceDataVersion=1 is required to create conference data
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventWithConference),
    }
  );

  const createdEvent = await handleApiResponse<CalendarEventWithMeet>(response);

  // Verify that Meet link was created
  if (!createdEvent.hangoutLink) {
    throw new GoogleCalendarError(
      'Failed to create Google Meet link for the event'
    );
  }

  return createdEvent;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(expiresAt: Date, bufferMinutes: number = 5): boolean {
  const bufferMs = bufferMinutes * 60 * 1000;
  return new Date(Date.now() + bufferMs) >= expiresAt;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<{ accessToken: string; newTokens?: TokenResponse }> {
  if (!isTokenExpired(expiresAt)) {
    return { accessToken };
  }

  // Token is expired or expiring soon, refresh it
  const newTokens = await refreshAccessToken(refreshToken);
  return {
    accessToken: newTokens.accessToken,
    newTokens,
  };
}

/**
 * Format event for display
 */
export function formatEventTime(event: CalendarEvent): {
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
} {
  const isAllDay = !event.start.dateTime;

  const startTime = event.start.dateTime
    ? new Date(event.start.dateTime)
    : new Date(event.start.date + 'T00:00:00');

  const endTime = event.end.dateTime
    ? new Date(event.end.dateTime)
    : new Date(event.end.date + 'T23:59:59');

  return { startTime, endTime, isAllDay };
}

/**
 * Create date-time object for event payload
 */
export function createDateTime(
  date: Date,
  timeZone?: string
): { dateTime: string; timeZone?: string } {
  return {
    dateTime: date.toISOString(),
    timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Create all-day date object for event payload
 */
export function createAllDayDate(date: Date): { date: string } {
  return {
    date: date.toISOString().split('T')[0]!,
  };
}
