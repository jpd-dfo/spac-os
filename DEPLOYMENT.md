# SPAC OS Deployment Guide

This guide covers deployment options for SPAC OS, including local development setup, staging, and production deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development](#local-development)
4. [Vercel Deployment](#vercel-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying SPAC OS, ensure you have:

- **Node.js** 18.17.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control
- **Docker** (optional, for containerized deployment)

### Required Service Accounts

1. **Supabase** - PostgreSQL database and authentication
   - Sign up at: https://supabase.com

2. **Clerk** - User authentication
   - Sign up at: https://clerk.com

3. **Anthropic** - AI capabilities (Claude)
   - Get API key at: https://console.anthropic.com

4. **Resend** - Email service
   - Sign up at: https://resend.com

5. **Upstash** - Redis caching (optional)
   - Sign up at: https://upstash.com

6. **Vercel** - Deployment platform
   - Sign up at: https://vercel.com

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL direct connection | `postgresql://...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Random 32-char string |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://app.spacos.io` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Redis URL for caching | - |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token | - |
| `ENABLE_AI_FEATURES` | Enable AI features | `true` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## Local Development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/spac-os.git
   cd spac-os
   ```

2. **Run setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Using Docker for Local Development

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Start with admin tools**
   ```bash
   docker-compose --profile tools up -d
   ```

3. **Access services**
   - Application: http://localhost:3000
   - Prisma Studio: http://localhost:5555
   - pgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081
   - MailHog: http://localhost:8025

4. **Stop services**
   ```bash
   docker-compose down
   ```

5. **View logs**
   ```bash
   docker-compose logs -f app
   ```

---

## Vercel Deployment

### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link project**
   ```bash
   vercel link
   ```

4. **Add environment variables**
   ```bash
   # Add each variable via CLI or Vercel dashboard
   vercel env add DATABASE_URL production
   vercel env add CLERK_SECRET_KEY production
   # ... add all required variables
   ```

### Deploy

1. **Deploy to preview**
   ```bash
   vercel
   ```

2. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add all required variables for each environment:
   - Production
   - Preview
   - Development

### Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL is automatically provisioned

### Vercel Configuration

The `vercel.json` file includes:

- Build settings
- Security headers
- Redirects
- Cron jobs (for scheduled tasks)

---

## Docker Deployment

### Build Production Image

```bash
docker build -t spac-os:latest --target production .
```

### Run Production Container

```bash
docker run -d \
  --name spac-os \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e CLERK_SECRET_KEY="your-clerk-key" \
  # ... other env vars
  spac-os:latest
```

### Docker Compose for Production

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  app:
    image: spac-os:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      # ... other env vars
    restart: unless-stopped
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Database Setup

### Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note down project URL and API keys

2. **Get Connection Strings**
   - Go to Settings > Database
   - Copy connection string (use pooled for `DATABASE_URL`)
   - Copy direct connection for `DIRECT_URL`

3. **Enable Required Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Database Migrations

1. **Create new migration**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Apply migrations (production)**
   ```bash
   npx prisma migrate deploy
   ```

3. **Reset database (development only)**
   ```bash
   npx prisma migrate reset
   ```

### Database Backups

Supabase provides automatic daily backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup.sql
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

The repository includes two workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and PR
   - Linting, type checking, tests
   - Build verification
   - Security scanning
   - Preview deployments for PRs

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Runs on push to `main`
   - Database migrations
   - Production deployment
   - Post-deployment verification

### Required GitHub Secrets

Add these secrets in GitHub Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `DATABASE_URL` | Production database URL |
| `DIRECT_URL` | Direct database connection |
| `SLACK_WEBHOOK_URL` | (Optional) For notifications |
| `SNYK_TOKEN` | (Optional) For security scans |
| `CODECOV_TOKEN` | (Optional) For code coverage |

### Getting Vercel Tokens

1. **API Token**: Account Settings > Tokens
2. **Org ID**: vercel.json after `vercel link`
3. **Project ID**: vercel.json after `vercel link`

---

## Monitoring & Logging

### Application Logs

**Vercel:**
- Dashboard > Deployments > Functions tab
- Real-time logs available

**Docker:**
```bash
docker logs -f spac-os
```

### Error Tracking (Sentry)

1. Create Sentry project at https://sentry.io
2. Add environment variables:
   ```
   SENTRY_DSN=your-dsn
   SENTRY_AUTH_TOKEN=your-token
   ```

### Health Checks

The application exposes health endpoints:
- `/api/health` - Basic health check
- `/health` - Redirects to `/api/health`

### Performance Monitoring

Vercel provides built-in analytics:
- Web Vitals
- Function execution times
- Error rates

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom:** `Error: Can't reach database server`

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check if IP is whitelisted in Supabase
- Ensure SSL mode is correct

#### 2. Prisma Client Errors

**Symptom:** `Error: @prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
```

#### 3. Build Failures

**Symptom:** Build fails with TypeScript errors

**Solutions:**
- Run `npm run type-check` locally
- Check for missing dependencies
- Verify environment variables are set

#### 4. Authentication Errors

**Symptom:** 401 Unauthorized errors

**Solutions:**
- Verify Clerk keys are correct
- Check if user session is valid
- Ensure cookies are being set

#### 5. Docker Build Issues

**Symptom:** Docker build fails

**Solutions:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t spac-os:latest .
```

### Getting Help

1. Check existing GitHub issues
2. Review application logs
3. Contact support at support@spacos.io

---

## Security Considerations

### Production Checklist

- [ ] All API keys are set via environment variables
- [ ] HTTPS is enforced
- [ ] Security headers are configured (via `vercel.json`)
- [ ] Database has restricted access
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Secrets are not committed to git

### Regular Maintenance

- Keep dependencies updated
- Review and rotate API keys quarterly
- Monitor error rates and security alerts
- Perform regular database backups
- Review access logs

---

## Support

For deployment issues or questions:

- **Documentation:** https://docs.spacos.io
- **Email:** support@spacos.io
- **GitHub Issues:** https://github.com/your-org/spac-os/issues
