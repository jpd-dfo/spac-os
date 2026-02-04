# Google API Setup Guide

This document explains how to configure Google OAuth credentials for Gmail and Google Calendar integration in SPAC OS.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application's deployment URL (or `http://localhost:3000` for local development)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **New Project**
4. Enter a project name (e.g., "SPAC OS")
5. Click **Create**
6. Wait for the project to be created, then select it from the project dropdown

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable the following APIs:

### Gmail API
- Search for "Gmail API"
- Click on **Gmail API**
- Click **Enable**

### Google Calendar API
- Search for "Google Calendar API"
- Click on **Google Calendar API**
- Click **Enable**

## Step 3: Configure OAuth Consent Screen

Before creating OAuth credentials, you must configure the consent screen that users will see when authorizing your application.

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or **Internal** if using Google Workspace and only want organization users)
3. Click **Create**

### App Information
- **App name**: SPAC OS
- **User support email**: Your email address
- **App logo**: (optional) Upload your application logo

### App Domain
- **Application home page**: Your application URL (e.g., `https://your-domain.com`)
- **Application privacy policy link**: Your privacy policy URL
- **Application terms of service link**: Your terms of service URL

### Authorized domains
- Add your domain (e.g., `your-domain.com`)

### Developer contact information
- Add your email address

4. Click **Save and Continue**

### Scopes
1. Click **Add or Remove Scopes**
2. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail messages
   - `https://www.googleapis.com/auth/gmail.send` - Send Gmail messages
   - `https://www.googleapis.com/auth/gmail.modify` - Modify Gmail labels and message state
   - `https://www.googleapis.com/auth/calendar` - Full access to Google Calendar
   - `https://www.googleapis.com/auth/calendar.events` - Manage calendar events
   - `openid` - Basic profile information
   - `email` - User email address
   - `profile` - User profile information

3. Click **Update** then **Save and Continue**

### Test Users (for development)
1. Click **Add Users**
2. Add the email addresses of users who will test the application
3. Click **Save and Continue**

> **Note**: While in testing mode, only users added as test users can authorize the application. For production, you'll need to submit the app for verification.

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the following:

### Name
- Enter a name (e.g., "SPAC OS Web Client")

### Authorized JavaScript origins
Add your application URLs:
- `http://localhost:3000` (for local development)
- `https://your-domain.com` (for production)

### Authorized redirect URIs
Add the OAuth callback URLs:
- `http://localhost:3000/api/auth/gmail/callback` (for Gmail)
- `http://localhost:3000/api/auth/google/callback` (for Google Calendar)
- `https://your-domain.com/api/auth/gmail/callback` (production)
- `https://your-domain.com/api/auth/google/callback` (production)

5. Click **Create**
6. A dialog will display your **Client ID** and **Client Secret**
7. Copy these values - you'll need them for your environment variables

## Step 5: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Gmail OAuth callback URL
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Application URL (used for Google Calendar callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production deployment (e.g., Vercel), add these same variables to your deployment environment.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console | `GOCSPX-...` |
| `GMAIL_REDIRECT_URI` | Callback URL for Gmail OAuth flow | `http://localhost:3000/api/auth/gmail/callback` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your application | `http://localhost:3000` |

## OAuth Scopes Used

### Gmail Integration
| Scope | Purpose |
|-------|---------|
| `gmail.readonly` | Read emails for CRM sync |
| `gmail.send` | Send emails from the application |
| `gmail.modify` | Mark emails as read, star/unstar, manage labels |

### Google Calendar Integration
| Scope | Purpose |
|-------|---------|
| `calendar` | Full calendar access for sync |
| `calendar.events` | Create, update, delete calendar events |

## Testing the Integration

### Check Configuration Status

The application provides health check endpoints to verify your Google API configuration:

1. **API Health Check**: `GET /api/trpc/integrations.healthCheck`
   - Returns the configuration status of Gmail and Calendar integrations
   - Shows whether credentials are configured (not validated)

2. **Gmail Status**: Use `email.getStatus` tRPC procedure
   - Returns connection status for the authenticated user
   - Shows token expiration and sync status

3. **Calendar Status**: Use `calendar.getGoogleStatus` tRPC procedure
   - Returns Google Calendar connection status
   - Shows connection details and expiration

### Manual Testing Flow

1. Start your development server: `npm run dev`
2. Navigate to the CRM settings page
3. Click "Connect Gmail" or "Connect Google Calendar"
4. Complete the Google OAuth flow
5. Verify the connection status shows as connected

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Verify your redirect URIs match exactly (including trailing slashes)
- Ensure the OAuth consent screen is configured
- Check that you're using the correct client ID

### "Error 403: access_denied"
- If in testing mode, ensure the user is added as a test user
- Verify the required scopes are added to the consent screen

### "Invalid_grant: Token has been expired or revoked"
- The refresh token has expired or been revoked
- User needs to re-authorize the application
- This can happen if the user revokes access from their Google account

### Credentials not working in production
- Ensure production URLs are added to authorized redirect URIs
- Verify environment variables are set correctly in your deployment platform
- Check that the consent screen has the production domain authorized

## Security Best Practices

1. **Never commit credentials**: Keep `GOOGLE_CLIENT_SECRET` out of version control
2. **Use environment variables**: Store all sensitive values in environment variables
3. **Rotate secrets periodically**: Regenerate client secrets if compromised
4. **Request minimal scopes**: Only request scopes that are actually needed
5. **Validate state parameter**: Always verify the OAuth state to prevent CSRF attacks
6. **Store tokens securely**: Encrypt tokens at rest in your database
7. **Handle token refresh**: Implement proper token refresh logic before expiration

## Publishing Your App (Production)

To allow any Google user to authorize your app (not just test users):

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Complete the verification process:
   - Provide detailed justification for requested scopes
   - Pass Google's security assessment
   - May require third-party security audit for sensitive scopes

> **Note**: Apps requesting sensitive scopes (like Gmail) require additional verification and may need a security assessment.

## Related Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)
