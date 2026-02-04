/**
 * SPAC OS - Integrations Router
 * Health check and status endpoints for external service integrations
 * Provides configuration status for Gmail, Google Calendar, and Calendly
 */

import { z } from 'zod';

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '../trpc';

// ============================================================================
// TYPES
// ============================================================================

interface IntegrationStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  integrations: {
    gmail: IntegrationStatus;
    googleCalendar: IntegrationStatus;
    calendly: IntegrationStatus;
  };
  environment: {
    hasGoogleClientId: boolean;
    hasGoogleClientSecret: boolean;
    hasGmailRedirectUri: boolean;
    hasAppUrl: boolean;
  };
}

// ============================================================================
// INTEGRATIONS ROUTER
// ============================================================================

export const integrationsRouter = createTRPCRouter({
  /**
   * Public health check endpoint for integration configuration status
   * This checks if the required environment variables are configured
   * It does NOT validate tokens or make API calls to external services
   */
  healthCheck: publicProcedure
    .query((): HealthCheckResult => {
      // Check environment variables
      const hasGoogleClientId = Boolean(process.env['GOOGLE_CLIENT_ID']);
      const hasGoogleClientSecret = Boolean(process.env['GOOGLE_CLIENT_SECRET']);
      const hasGmailRedirectUri = Boolean(process.env['GMAIL_REDIRECT_URI']);
      const hasAppUrl = Boolean(process.env['NEXT_PUBLIC_APP_URL']);

      // Gmail status
      const gmailConfigured = hasGoogleClientId && hasGoogleClientSecret && hasGmailRedirectUri;
      const gmailStatus: IntegrationStatus = {
        configured: gmailConfigured,
        connected: false, // Public endpoint can't check user-specific connections
        message: gmailConfigured
          ? 'Gmail API credentials are configured. Users can connect their accounts.'
          : 'Gmail API credentials are not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GMAIL_REDIRECT_URI.',
        details: {
          hasClientId: hasGoogleClientId,
          hasClientSecret: hasGoogleClientSecret,
          hasRedirectUri: hasGmailRedirectUri,
        },
      };

      // Google Calendar status
      const calendarConfigured = hasGoogleClientId && hasGoogleClientSecret && hasAppUrl;
      const calendarStatus: IntegrationStatus = {
        configured: calendarConfigured,
        connected: false, // Public endpoint can't check user-specific connections
        message: calendarConfigured
          ? 'Google Calendar API credentials are configured. Users can connect their accounts.'
          : 'Google Calendar API credentials are not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL.',
        details: {
          hasClientId: hasGoogleClientId,
          hasClientSecret: hasGoogleClientSecret,
          hasAppUrl: hasAppUrl,
        },
      };

      // Calendly status (optional integration)
      const hasCalendlyApiKey = Boolean(process.env['CALENDLY_API_KEY']);
      const calendlyStatus: IntegrationStatus = {
        configured: true, // Calendly uses per-user API keys, so it's always "configurable"
        connected: false,
        message: hasCalendlyApiKey
          ? 'Calendly integration is configured with a default API key.'
          : 'Calendly integration is available. Users can connect with their personal API keys.',
        details: {
          hasDefaultApiKey: hasCalendlyApiKey,
        },
      };

      // Determine overall status
      let status: HealthCheckResult['status'] = 'healthy';
      if (!gmailConfigured && !calendarConfigured) {
        status = 'unhealthy';
      } else if (!gmailConfigured || !calendarConfigured) {
        status = 'degraded';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        integrations: {
          gmail: gmailStatus,
          googleCalendar: calendarStatus,
          calendly: calendlyStatus,
        },
        environment: {
          hasGoogleClientId,
          hasGoogleClientSecret,
          hasGmailRedirectUri,
          hasAppUrl,
        },
      };
    }),

  /**
   * Protected endpoint to check a user's connection status for all integrations
   * Returns detailed status including token expiration and sync state
   */
  getConnectionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        return {
          gmail: { connected: false, message: 'Not authenticated' },
          googleCalendar: { connected: false, message: 'Not authenticated' },
          calendly: { connected: false, message: 'Not authenticated' },
        };
      }

      // Check Gmail connection
      const emailConnection = await ctx.db.emailConnection.findUnique({
        where: { userId },
        select: {
          id: true,
          provider: true,
          expiresAt: true,
          historyId: true,
          createdAt: true,
        },
      });

      const gmailConnected = Boolean(emailConnection);
      const gmailExpired = emailConnection?.expiresAt
        ? emailConnection.expiresAt < new Date()
        : false;

      // Check Google Calendar connection
      const googleCalendarConnection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId,
          provider: 'google',
        },
        select: {
          id: true,
          expiresAt: true,
          createdAt: true,
          scope: true,
        },
      });

      const googleCalendarConnected = Boolean(googleCalendarConnection);
      const googleCalendarExpired = googleCalendarConnection?.expiresAt
        ? googleCalendarConnection.expiresAt < new Date()
        : false;

      // Check Calendly connection
      const calendlyConnection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId,
          provider: 'calendly',
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const calendlyConnected = Boolean(calendlyConnection);

      // Build message strings without nested ternaries
      let gmailMessage = 'Gmail not connected.';
      if (gmailConnected) {
        gmailMessage = gmailExpired
          ? 'Gmail connected but token expired. Please reconnect.'
          : 'Gmail connected and active.';
      }

      let googleCalendarMessage = 'Google Calendar not connected.';
      if (googleCalendarConnected) {
        googleCalendarMessage = googleCalendarExpired
          ? 'Google Calendar connected but token expired. Please reconnect.'
          : 'Google Calendar connected and active.';
      }

      return {
        gmail: {
          connected: gmailConnected,
          expired: gmailExpired,
          needsReauth: gmailExpired,
          connectedAt: emailConnection?.createdAt,
          expiresAt: emailConnection?.expiresAt,
          provider: emailConnection?.provider,
          lastSyncHistoryId: emailConnection?.historyId,
          message: gmailMessage,
        },
        googleCalendar: {
          connected: googleCalendarConnected,
          expired: googleCalendarExpired,
          needsReauth: googleCalendarExpired,
          connectedAt: googleCalendarConnection?.createdAt,
          expiresAt: googleCalendarConnection?.expiresAt,
          scope: googleCalendarConnection?.scope,
          message: googleCalendarMessage,
        },
        calendly: {
          connected: calendlyConnected,
          connectedAt: calendlyConnection?.createdAt,
          updatedAt: calendlyConnection?.updatedAt,
          message: calendlyConnected
            ? 'Calendly connected and active.'
            : 'Calendly not connected.',
        },
      };
    }),

  /**
   * Get configuration requirements for setting up integrations
   * Useful for admin setup pages to show what's needed
   */
  getSetupRequirements: publicProcedure
    .query(() => {
      return {
        gmail: {
          name: 'Gmail Integration',
          description: 'Connect Gmail to sync emails with contacts and send emails from the CRM.',
          requiredEnvVars: [
            {
              name: 'GOOGLE_CLIENT_ID',
              description: 'OAuth 2.0 Client ID from Google Cloud Console',
              configured: Boolean(process.env['GOOGLE_CLIENT_ID']),
            },
            {
              name: 'GOOGLE_CLIENT_SECRET',
              description: 'OAuth 2.0 Client Secret from Google Cloud Console',
              configured: Boolean(process.env['GOOGLE_CLIENT_SECRET']),
            },
            {
              name: 'GMAIL_REDIRECT_URI',
              description: 'OAuth callback URL for Gmail (must match Google Cloud Console)',
              configured: Boolean(process.env['GMAIL_REDIRECT_URI']),
            },
          ],
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
          ],
          setupGuide: '/docs/GOOGLE_API_SETUP.md',
        },
        googleCalendar: {
          name: 'Google Calendar Integration',
          description: 'Connect Google Calendar to schedule meetings and sync events.',
          requiredEnvVars: [
            {
              name: 'GOOGLE_CLIENT_ID',
              description: 'OAuth 2.0 Client ID from Google Cloud Console',
              configured: Boolean(process.env['GOOGLE_CLIENT_ID']),
            },
            {
              name: 'GOOGLE_CLIENT_SECRET',
              description: 'OAuth 2.0 Client Secret from Google Cloud Console',
              configured: Boolean(process.env['GOOGLE_CLIENT_SECRET']),
            },
            {
              name: 'NEXT_PUBLIC_APP_URL',
              description: 'Public URL of your application for OAuth callback',
              configured: Boolean(process.env['NEXT_PUBLIC_APP_URL']),
            },
          ],
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ],
          setupGuide: '/docs/GOOGLE_API_SETUP.md',
        },
        calendly: {
          name: 'Calendly Integration',
          description: 'Connect Calendly to generate booking links and track scheduled meetings.',
          requiredEnvVars: [
            {
              name: 'CALENDLY_API_KEY',
              description: 'Personal Access Token from Calendly (optional - users can provide their own)',
              configured: Boolean(process.env['CALENDLY_API_KEY']),
              optional: true,
            },
          ],
          scopes: [],
          setupGuide: 'https://calendly.com/integrations/api_webhooks',
        },
      };
    }),

  /**
   * Validate Google OAuth credentials by checking if we can construct valid OAuth URLs
   * This is a lightweight check that doesn't make external API calls
   */
  validateGoogleCredentials: publicProcedure
    .input(z.object({
      checkType: z.enum(['gmail', 'calendar', 'both']).default('both'),
    }).optional())
    .query(({ input }) => {
      const checkType = input?.checkType ?? 'both';
      const clientId = process.env['GOOGLE_CLIENT_ID'];
      const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
      const gmailRedirectUri = process.env['GMAIL_REDIRECT_URI'];
      const appUrl = process.env['NEXT_PUBLIC_APP_URL'];

      const results: Record<string, { valid: boolean; issues: string[] }> = {};

      if (checkType === 'gmail' || checkType === 'both') {
        const gmailIssues: string[] = [];

        if (!clientId) {
          gmailIssues.push('GOOGLE_CLIENT_ID is not set');
        } else if (!clientId.includes('.apps.googleusercontent.com')) {
          gmailIssues.push('GOOGLE_CLIENT_ID does not appear to be a valid Google OAuth client ID');
        }

        if (!clientSecret) {
          gmailIssues.push('GOOGLE_CLIENT_SECRET is not set');
        }

        if (!gmailRedirectUri) {
          gmailIssues.push('GMAIL_REDIRECT_URI is not set');
        } else {
          try {
            new URL(gmailRedirectUri);
          } catch {
            gmailIssues.push('GMAIL_REDIRECT_URI is not a valid URL');
          }
        }

        results['gmail'] = {
          valid: gmailIssues.length === 0,
          issues: gmailIssues,
        };
      }

      if (checkType === 'calendar' || checkType === 'both') {
        const calendarIssues: string[] = [];

        if (!clientId) {
          calendarIssues.push('GOOGLE_CLIENT_ID is not set');
        } else if (!clientId.includes('.apps.googleusercontent.com')) {
          calendarIssues.push('GOOGLE_CLIENT_ID does not appear to be a valid Google OAuth client ID');
        }

        if (!clientSecret) {
          calendarIssues.push('GOOGLE_CLIENT_SECRET is not set');
        }

        if (!appUrl) {
          calendarIssues.push('NEXT_PUBLIC_APP_URL is not set');
        } else {
          try {
            new URL(appUrl);
          } catch {
            calendarIssues.push('NEXT_PUBLIC_APP_URL is not a valid URL');
          }
        }

        results['calendar'] = {
          valid: calendarIssues.length === 0,
          issues: calendarIssues,
        };
      }

      const allValid = Object.values(results).every(r => r.valid);

      return {
        valid: allValid,
        results,
        message: allValid
          ? 'All credentials appear to be configured correctly.'
          : 'Some credentials are missing or invalid. See issues for details.',
      };
    }),
});
