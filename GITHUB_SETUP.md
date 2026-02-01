# GitHub Repository Setup Guide

This guide covers the complete setup process for the SPAC OS GitHub repository, including initial setup, branch protection, CI/CD configuration, and Vercel integration.

## Table of Contents

- [Creating the Repository](#creating-the-repository)
- [Initial Push](#initial-push)
- [Branch Protection Rules](#branch-protection-rules)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Vercel Integration](#vercel-integration)
- [Additional Configuration](#additional-configuration)

---

## Creating the Repository

### Option 1: GitHub CLI (Recommended)

```bash
# Authenticate with GitHub
gh auth login

# Create the repository
gh repo create di-rezze-family-office/spac-os \
  --private \
  --description "SPAC Operating System - Enterprise Deal Management Platform" \
  --homepage "https://spacos.io"

# Or create a public repository
gh repo create di-rezze-family-office/spac-os \
  --public \
  --description "SPAC Operating System - Enterprise Deal Management Platform"
```

### Option 2: GitHub Web Interface

1. Go to [github.com/new](https://github.com/new)
2. Select owner: `di-rezze-family-office`
3. Repository name: `spac-os`
4. Description: `SPAC Operating System - Enterprise Deal Management Platform`
5. Visibility: Private (recommended for enterprise)
6. Do NOT initialize with README, .gitignore, or license (we have these already)
7. Click "Create repository"

---

## Initial Push

### Initialize Git and Push

```bash
# Navigate to the project directory
cd spac-os

# Initialize Git repository (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SPAC OS v1.0.0

- Complete Next.js 14 application setup
- Prisma database schema for SPAC management
- Authentication with NextAuth.js
- AI-powered document analysis
- Real-time collaboration features
- Comprehensive API routes
- Full UI component library"

# Add remote origin
git remote add origin https://github.com/di-rezze-family-office/spac-os.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Create Development Branch

```bash
# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Return to main
git checkout main
```

---

## Branch Protection Rules

### Main Branch Protection

Go to: **Settings > Branches > Add branch protection rule**

**Branch name pattern:** `main`

Enable the following:

- [x] **Require a pull request before merging**
  - [x] Require approvals: 1 (or more for teams)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Status checks to require:
    - `build`
    - `lint`
    - `type-check`
    - `test`

- [x] **Require conversation resolution before merging**

- [x] **Require signed commits** (optional, for enhanced security)

- [x] **Require linear history** (optional, for cleaner history)

- [x] **Do not allow bypassing the above settings**

- [x] **Restrict who can push to matching branches**
  - Add: Repository admins only

### CLI Configuration (Alternative)

```bash
# Using GitHub CLI to set branch protection
gh api repos/di-rezze-family-office/spac-os/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build","lint","type-check","test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

---

## GitHub Secrets Configuration

Navigate to: **Settings > Secrets and variables > Actions**

### Required Secrets

Add the following secrets for CI/CD:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL` | Production database connection string | `postgresql://user:pass@host:5432/spac_os` |
| `NEXTAUTH_SECRET` | NextAuth.js secret (generate with `openssl rand -base64 32`) | `abc123...` |
| `NEXTAUTH_URL` | Production URL | `https://spacos.io` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `VERCEL_TOKEN` | Vercel deployment token | `...` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_...` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_...` |

### Environment Variables

Add environment variables for the deployment:

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://spacos.io` |

### Create Secrets via CLI

```bash
# Set secrets using GitHub CLI
gh secret set DATABASE_URL --body "your-database-url"
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_URL --body "https://spacos.io"
gh secret set ANTHROPIC_API_KEY --body "your-anthropic-key"
gh secret set OPENAI_API_KEY --body "your-openai-key"
```

---

## GitHub Actions CI/CD

Create the following workflow files:

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run TypeScript
        run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://spacos.io
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install Vercel CLI
        run: pnpm add -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Database Migrations
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Vercel Integration

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`

4. Add environment variables in Vercel dashboard:
   - All secrets from GitHub Secrets section
   - Any additional production-specific variables

5. Deploy!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Link to project (creates new or links existing)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Get Vercel IDs for GitHub Actions

```bash
# After linking, get the IDs from .vercel/project.json
cat .vercel/project.json

# Output will include:
# {
#   "projectId": "prj_...",
#   "orgId": "team_..."
# }
```

---

## Additional Configuration

### CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Default owners for everything
* @di-rezze-family-office/spac-os-maintainers

# Frontend code
/src/components/ @di-rezze-family-office/frontend-team
/src/app/ @di-rezze-family-office/frontend-team

# Backend code
/src/server/ @di-rezze-family-office/backend-team
/src/lib/ @di-rezze-family-office/backend-team
/prisma/ @di-rezze-family-office/backend-team

# Infrastructure
/.github/ @di-rezze-family-office/devops-team
/docker/ @di-rezze-family-office/devops-team
```

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: Report a bug or unexpected behavior
labels: ["bug", "triage"]
body:
  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear description of the bug
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen
    validations:
      required: true
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true
```

### Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Summary

<!-- Brief description of the changes -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if needed)
- [ ] No new warnings introduced
```

---

## Security Checklist

Before going live, ensure:

- [ ] All secrets are stored in GitHub Secrets (not in code)
- [ ] Branch protection rules are enabled
- [ ] Dependency scanning is enabled (Dependabot)
- [ ] Code scanning is enabled (CodeQL)
- [ ] Two-factor authentication enabled for all team members
- [ ] Access permissions reviewed and minimized
- [ ] Production database has separate credentials from development

---

## Quick Reference

### Common Commands

```bash
# Clone repository
git clone https://github.com/di-rezze-family-office/spac-os.git

# Create feature branch
git checkout -b feature/new-feature

# Push branch
git push -u origin feature/new-feature

# Create PR via CLI
gh pr create --title "Add new feature" --body "Description"

# View CI status
gh run list

# View deployment status
vercel ls
```

### Useful Links

- **Repository:** https://github.com/di-rezze-family-office/spac-os
- **Vercel Dashboard:** https://vercel.com/di-rezze-family-office/spac-os
- **Production URL:** https://spacos.io
- **CI/CD Workflows:** https://github.com/di-rezze-family-office/spac-os/actions

---

## Support

For setup issues:
1. Check the [GitHub Actions logs](https://github.com/di-rezze-family-office/spac-os/actions)
2. Review [Vercel deployment logs](https://vercel.com/di-rezze-family-office/spac-os/deployments)
3. Contact the DevOps team at devops@direzze.com
