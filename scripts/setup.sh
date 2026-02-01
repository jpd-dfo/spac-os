#!/bin/bash

# =============================================================================
# SPAC OS - Initial Setup Script
# =============================================================================
# This script sets up the local development environment
# Run with: chmod +x scripts/setup.sh && ./scripts/setup.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo ""
echo "=============================================="
echo "       SPAC OS - Development Setup"
echo "=============================================="
echo ""

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ]; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version: $(node -v)"

# Check npm version
print_status "Checking npm version..."
NPM_VERSION=$(npm -v 2>/dev/null | cut -d. -f1)
if [ -z "$NPM_VERSION" ]; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm version: $(npm -v)"

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    print_status "Creating .env.local from .env.example..."
    cp .env.example .env.local
    print_success "Created .env.local"
    print_warning "Please update .env.local with your actual environment variables"
else
    print_status ".env.local already exists, skipping..."
fi

# Check if Docker is available for database setup
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    DOCKER_AVAILABLE=true
    print_status "Docker is available"
fi

# Database setup options
echo ""
echo "=============================================="
echo "         Database Setup Options"
echo "=============================================="
echo ""
echo "1) Use Docker (local PostgreSQL)"
echo "2) Use Supabase (cloud database)"
echo "3) Skip database setup"
echo ""

read -p "Select an option (1-3): " DB_OPTION

case $DB_OPTION in
    1)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            print_status "Starting Docker containers..."
            docker-compose up -d postgres redis

            # Wait for PostgreSQL to be ready
            print_status "Waiting for PostgreSQL to be ready..."
            sleep 5

            # Update .env.local with Docker database URL
            if grep -q "DATABASE_URL=" .env.local; then
                sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL=postgresql://spac_os:spac_os_dev_password@localhost:5432/spac_os?schema=public|' .env.local
                sed -i.bak 's|DIRECT_URL=.*|DIRECT_URL=postgresql://spac_os:spac_os_dev_password@localhost:5432/spac_os?schema=public|' .env.local
                rm -f .env.local.bak
            fi

            print_success "Docker containers started"
        else
            print_error "Docker is not available. Please install Docker or use Supabase."
            exit 1
        fi
        ;;
    2)
        print_status "Using Supabase for database"
        print_warning "Make sure to update DATABASE_URL and DIRECT_URL in .env.local"
        ;;
    3)
        print_status "Skipping database setup"
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migrations (if database is available)
if [ "$DB_OPTION" != "3" ]; then
    print_status "Running database migrations..."

    # Check if we can connect to the database
    if npx prisma migrate deploy 2>/dev/null; then
        print_success "Database migrations applied"

        # Ask about seeding
        echo ""
        read -p "Would you like to seed the database with sample data? (y/N): " SEED_OPTION
        if [[ "$SEED_OPTION" =~ ^[Yy]$ ]]; then
            print_status "Seeding database..."
            npm run db:seed
            print_success "Database seeded with sample data"
        fi
    else
        print_warning "Could not run migrations. Make sure your database is properly configured."
        print_warning "You can run migrations manually with: npx prisma migrate deploy"
    fi
fi

# Setup git hooks (optional)
echo ""
read -p "Would you like to set up git hooks for linting? (y/N): " HOOKS_OPTION
if [[ "$HOOKS_OPTION" =~ ^[Yy]$ ]]; then
    print_status "Setting up git hooks..."

    # Create pre-commit hook
    mkdir -p .git/hooks
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run lint
npm run type-check
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git hooks configured"
fi

# Final summary
echo ""
echo "=============================================="
echo "           Setup Complete!"
echo "=============================================="
echo ""
print_success "SPAC OS development environment is ready!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your actual API keys"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""

if [ "$DOCKER_AVAILABLE" = true ] && [ "$DB_OPTION" = "1" ]; then
    echo "Docker services running:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    echo "Useful commands:"
    echo "  - Start services: docker-compose up -d"
    echo "  - Stop services: docker-compose down"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Prisma Studio: npm run db:studio"
    echo ""
fi

echo "For more information, see DEPLOYMENT.md"
echo ""
