/**
 * SPAC OS - Google OAuth Callback Route
 * Handles OAuth callback from Google for Gmail and Calendar integration
 * Sprint 8 Track C - Google OAuth Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

type ServiceType = 'gmail' | 'calendar' | 'both';

interface OAuthState {
  service: ServiceType;
  redirectUrl: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Decode state parameter from Google OAuth callback
 */
function decodeState(stateParam: string | null): OAuthState {
  const defaultState: OAuthState = {
    service: 'both',
    redirectUrl: '/settings/integrations',
  };

  if (!stateParam) {
    return defaultState;
  }

  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    return {
      service: decoded.service || defaultState.service,
      redirectUrl: decoded.redirectUrl || defaultState.redirectUrl,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResult> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
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

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google token exchange failed:', errorData);
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const tokens: GoogleTokenResponse = await response.json();

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt,
    scope: tokens.scope,
  };
}

/**
 * Build redirect URL with query parameters
 */
function buildRedirectUrl(
  baseUrl: string,
  redirectPath: string,
  params: Record<string, string>
): string {
  // Handle relative paths
  const url = redirectPath.startsWith('http')
    ? new URL(redirectPath)
    : new URL(redirectPath, baseUrl);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/auth/google/callback
 *
 * Handles OAuth callback from Google after user authorization.
 *
 * Query Parameters (from Google):
 * - code: Authorization code to exchange for tokens
 * - state: Encoded state with service type and redirect URL
 * - error: Error code if authorization was denied
 *
 * Actions:
 * 1. Decode state parameter
 * 2. Handle errors from Google
 * 3. Verify user is authenticated via Clerk
 * 4. Exchange authorization code for tokens
 * 5. Store tokens in EmailConnection and/or CalendarConnection
 * 6. Redirect to original redirectUrl with success/error message
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  // Decode state to get service type and redirect URL
  const state = decodeState(stateParam);

  // Get base URL for redirects
  const baseUrl = process.env['NEXTAUTH_URL'] || process.env['NEXT_PUBLIC_APP_URL'] || '';

  // Handle errors from Google (user denied access, etc.)
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, state.redirectUrl, {
        error: 'oauth_denied',
        message: error,
      })
    );
  }

  // Verify authorization code was provided
  if (!code) {
    console.error('Google OAuth callback: No authorization code provided');
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, state.redirectUrl, {
        error: 'oauth_failed',
        message: 'No authorization code received',
      })
    );
  }

  try {
    // Get authenticated user from Clerk
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      console.error('Google OAuth callback: User not authenticated');
      return NextResponse.redirect(
        buildRedirectUrl(baseUrl, state.redirectUrl, {
          error: 'not_authenticated',
          message: 'Please sign in to connect Google services',
        })
      );
    }

    // Find user in our database by Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      console.error('Google OAuth callback: User not found in database', { clerkUserId });
      return NextResponse.redirect(
        buildRedirectUrl(baseUrl, state.redirectUrl, {
          error: 'user_not_found',
          message: 'User account not found',
        })
      );
    }

    // Exchange authorization code for tokens
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Store tokens based on service type
    const promises: Promise<unknown>[] = [];

    // Store Gmail connection
    if (state.service === 'gmail' || state.service === 'both') {
      promises.push(
        db.emailConnection.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            provider: 'gmail',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          },
          update: {
            accessToken: tokens.accessToken,
            // Only update refresh token if a new one was provided
            ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
            expiresAt: tokens.expiresAt,
          },
        })
      );
    }

    // Store Calendar connection
    if (state.service === 'calendar' || state.service === 'both') {
      promises.push(
        db.calendarConnection.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            provider: 'google',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            scope: tokens.scope,
          },
          update: {
            accessToken: tokens.accessToken,
            // Only update refresh token if a new one was provided
            ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
            expiresAt: tokens.expiresAt,
            scope: tokens.scope,
          },
        })
      );
    }

    // Execute all database operations
    await Promise.all(promises);

    console.log('Google OAuth successful', {
      userId: user.id,
      service: state.service,
    });

    // Redirect to success page
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, state.redirectUrl, {
        success: 'connected',
        service: state.service,
      })
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, state.redirectUrl, {
        error: 'oauth_failed',
        message: errorMessage,
      })
    );
  }
}
