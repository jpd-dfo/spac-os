/**
 * SPAC OS - Google OAuth Initiation Route
 * Initiates Google OAuth flow for Gmail and Calendar integration
 * Sprint 8 Track C - Google OAuth Integration
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

type ServiceType = 'gmail' | 'calendar' | 'both';

// ============================================================================
// SCOPES
// ============================================================================

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get OAuth scopes based on the service type
 */
function getScopesForService(service: ServiceType): string[] {
  const scopes: string[] = [];

  if (service === 'gmail' || service === 'both') {
    scopes.push(...GMAIL_SCOPES);
  }

  if (service === 'calendar' || service === 'both') {
    scopes.push(...CALENDAR_SCOPES);
  }

  return scopes;
}

/**
 * Encode state parameter with service type and redirect URL
 */
function encodeState(service: ServiceType, redirectUrl: string): string {
  return Buffer.from(JSON.stringify({ service, redirectUrl })).toString('base64');
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/auth/google
 *
 * Initiates Google OAuth flow for Gmail and/or Calendar integration.
 *
 * Query Parameters:
 * - service: 'gmail' | 'calendar' | 'both' (default: 'both')
 * - redirectUrl: Where to redirect after OAuth callback (default: '/settings/integrations')
 *
 * Returns: Redirect to Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const serviceParam = searchParams.get('service');
    const service: ServiceType =
      serviceParam === 'gmail' || serviceParam === 'calendar' || serviceParam === 'both'
        ? serviceParam
        : 'both';
    const redirectUrl = searchParams.get('redirectUrl') || '/settings/integrations';

    // Validate environment variables
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const baseUrl = process.env['NEXTAUTH_URL'] || process.env['NEXT_PUBLIC_APP_URL'];

    if (!clientId) {
      console.error('Google OAuth: GOOGLE_CLIENT_ID is not configured');
      return NextResponse.redirect(
        new URL(`${redirectUrl}?error=oauth_not_configured`, request.url)
      );
    }

    if (!baseUrl) {
      console.error('Google OAuth: NEXTAUTH_URL or NEXT_PUBLIC_APP_URL is not configured');
      return NextResponse.redirect(
        new URL(`${redirectUrl}?error=oauth_not_configured`, request.url)
      );
    }

    // Build scopes based on service type
    const scopes = getScopesForService(service);

    // Generate state parameter with service type and redirect URL
    const state = encodeState(service, redirectUrl);

    // Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', state);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Google OAuth initiation error:', error);

    // Redirect to default page with error
    const baseUrl = process.env['NEXTAUTH_URL'] || process.env['NEXT_PUBLIC_APP_URL'] || '';
    return NextResponse.redirect(
      new URL('/settings/integrations?error=oauth_error', baseUrl || request.url)
    );
  }
}
