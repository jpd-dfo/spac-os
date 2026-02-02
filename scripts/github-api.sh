#!/bin/bash
# GitHub API automation scripts
# Usage: ./scripts/github-api.sh <command> [args]
#
# NOTE: Direct GitHub API calls may be blocked by proxy.
# git operations work. For API calls, use 'gh' CLI or run without proxy.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load credentials from .env.local
source .env.local 2>/dev/null || { echo "Error: .env.local not found"; exit 1; }

# Verify required variables
: "${GITHUB_PAT:?GITHUB_PAT not set in .env.local}"
: "${GITHUB_OWNER:?GITHUB_OWNER not set in .env.local}"
: "${GITHUB_REPO:?GITHUB_REPO not set in .env.local}"

API_BASE="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO"

# Helper function for API calls
gh_api() {
  local method=$1
  local endpoint=$2
  local data=$3

  curl -s -X "$method" \
    -H "Authorization: token $GITHUB_PAT" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    "${API_BASE}${endpoint}" \
    ${data:+-d "$data"}
}

case "$1" in
  push)
    git remote set-url origin "https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
    git push origin "${2:-main}"
    ;;

  create-pr)
    gh_api POST "/pulls" "{\"title\":\"$2\",\"body\":\"$3\",\"head\":\"${4:-$(git branch --show-current)}\",\"base\":\"${5:-main}\"}"
    ;;

  merge-pr)
    gh_api PUT "/pulls/$2/merge" "{\"merge_method\":\"${3:-squash}\"}"
    ;;

  set-variable)
    gh_api POST "/actions/variables" "{\"name\":\"$2\",\"value\":\"$3\"}" 2>/dev/null || \
    gh_api PATCH "/actions/variables/$2" "{\"value\":\"$3\"}"
    echo "Variable $2 set"
    ;;

  trigger-workflow)
    gh_api POST "/actions/workflows/${2:-deploy.yml}/dispatches" "{\"ref\":\"${3:-main}\",\"inputs\":${4:-{}}}"
    echo "Workflow triggered"
    ;;

  list-runs)
    gh_api GET "/actions/workflows/${2:-deploy.yml}/runs?per_page=5" | jq '.workflow_runs[] | {id, status, conclusion, created_at}'
    ;;

  cancel-run)
    gh_api POST "/actions/runs/$2/cancel"
    echo "Run $2 cancelled"
    ;;

  *)
    echo "GitHub API Helper"
    echo "Commands: push, create-pr, merge-pr, set-variable, trigger-workflow, list-runs, cancel-run"
    ;;
esac
