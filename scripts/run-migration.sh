#!/bin/bash
# SPAC OS - Database Migration Script
# Automatically pushes Prisma schema to Supabase

set -e  # Exit on any error

echo "🚀 SPAC OS Database Migration"
echo "=============================="

# Navigate to project directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "📁 Working directory: $PROJECT_DIR"

# Check for required files
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found"
    exit 1
fi

# Determine which env file to use
if [ -f ".env" ]; then
    echo "📄 Using .env for database connection"
elif [ -f ".env.local" ]; then
    echo "📄 Using .env.local for database connection"
    # Copy DATABASE_URL from .env.local to temp .env for Prisma
    grep "^DATABASE_URL" .env.local > .env.prisma.tmp 2>/dev/null || true
    if [ -s ".env.prisma.tmp" ]; then
        export $(cat .env.prisma.tmp | xargs)
        rm .env.prisma.tmp
    fi
else
    echo "❌ Error: No .env or .env.local file found"
    exit 1
fi

echo ""
echo "📊 Pushing Prisma schema to Supabase..."

# Run the migration
npx prisma db push

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration successful!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify tables in Supabase dashboard"
    echo "   2. Run 'pnpm db:generate' to update Prisma client"
    echo "   3. Optionally seed with 'pnpm db:seed'"
else
    echo ""
    echo "❌ Migration failed"
    exit 1
fi
