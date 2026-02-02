#!/bin/bash
# Deployment script - git push + workflow trigger
# Usage: ./scripts/deploy.sh

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Load credentials from .env.local
source .env.local 2>/dev/null || { echo "Error: .env.local not found"; exit 1; }

# Verify required variables
: "${GITHUB_PAT:?GITHUB_PAT not set in .env.local}"
: "${GITHUB_OWNER:?GITHUB_OWNER not set in .env.local}"
: "${GITHUB_REPO:?GITHUB_REPO not set in .env.local}"

echo "=== SPAC-OS Deployment ==="

# 1. Push to remote
echo "1. Pushing to GitHub..."
git remote set-url origin "https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
git push origin main

echo ""
echo "2. Push complete. GitHub Actions will run automatically on push."
echo "   View at: https://github.com/$GITHUB_OWNER/$GITHUB_REPO/actions"
