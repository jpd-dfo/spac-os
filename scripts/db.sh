#!/bin/bash
# Database operations script
# Usage: ./scripts/db.sh <command>

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Load from .env.local
source .env.local 2>/dev/null || true

case "$1" in
  migrate)
    echo "Running Prisma migrations..."
    npx prisma migrate deploy
    ;;

  generate)
    echo "Generating Prisma client..."
    npx prisma generate
    ;;

  push)
    echo "Pushing schema to database..."
    npx prisma db push
    ;;

  studio)
    echo "Opening Prisma Studio..."
    npx prisma studio
    ;;

  seed)
    echo "Seeding database..."
    npx prisma db seed
    ;;

  reset)
    echo "WARNING: This will delete all data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      npx prisma migrate reset --force
    fi
    ;;

  *)
    echo "Database Operations"
    echo "Commands: migrate, generate, push, studio, seed, reset"
    ;;
esac
