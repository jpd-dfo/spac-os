<p align="center">
  <img src="public/logo.svg" alt="SPAC OS Logo" width="200" height="200" />
</p>

<h1 align="center">SPAC OS</h1>

<p align="center">
  <strong>Enterprise SPAC Deal Management Platform</strong>
</p>

<p align="center">
  A comprehensive operating system for managing Special Purpose Acquisition Company (SPAC) deals,
  from target identification through de-SPAC completion.
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#deployment">Deployment</a> |
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

SPAC OS is a next-generation deal management platform built specifically for SPAC sponsors, investment banks, and legal teams. It streamlines the entire SPAC lifecycle with AI-powered document analysis, real-time compliance tracking, and comprehensive financial modeling.

## Features

### Core Capabilities

- **Deal Pipeline Management** - Track SPACs from formation through de-SPAC with customizable workflow stages
- **Target Screening** - AI-powered target identification and scoring based on sector, valuation, and strategic fit
- **Document Management** - Centralized data room with version control, access logging, and AI-powered extraction
- **Compliance Tracking** - Automated SEC filing deadlines, regulatory requirement monitoring, and audit trails
- **Financial Modeling** - Pro forma analysis, redemption scenarios, trust accounting, and PIPE financing

### Advanced Features

- **AI Document Analysis** - Automated extraction of key terms, risk factors, and financial data from contracts
- **Real-time Collaboration** - WebSocket-powered updates for team coordination
- **SEC EDGAR Integration** - Automatic filing retrieval and deadline tracking
- **Customizable Dashboards** - Role-based views for sponsors, legal, and finance teams
- **Reporting & Analytics** - Pipeline analytics, deal comparisons, and executive summaries

### Security & Compliance

- **Role-Based Access Control** - Granular permissions for sensitive deal information
- **Audit Logging** - Complete activity history for compliance requirements
- **Data Encryption** - At-rest and in-transit encryption for all sensitive data
- **SSO Integration** - Enterprise authentication via Azure AD, Okta, or Google Workspace

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/), [Headless UI](https://headlessui.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query) |
| **Data Tables** | [TanStack Table](https://tanstack.com/table) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/), [Heroicons](https://heroicons.com/) |
| **AI/ML** | [Anthropic Claude](https://www.anthropic.com/), [OpenAI](https://openai.com/) |

## Quick Start

### Prerequisites

- **Node.js** 18.17.0 or higher
- **pnpm** (recommended) or npm
- **PostgreSQL** 14 or higher
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/di-rezze-family-office/spac-os.git
cd spac-os
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Configure your environment** (see [Environment Setup](#environment-setup))

5. **Initialize the database**

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

6. **Start the development server**

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/spac_os"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# AI Services
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

# SEC EDGAR API
SEC_EDGAR_USER_AGENT="CompanyName admin@company.com"

# File Storage (S3-compatible)
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""

# Redis (for WebSocket and caching)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
```

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check

# Database commands
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Prisma Studio
pnpm db:seed        # Seed database with sample data
```

## Project Structure

```
spac-os/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── (auth)/        # Authentication pages
│   │   └── (dashboard)/   # Main application pages
│   ├── components/        # React components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── pipeline/      # Deal pipeline components
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and configurations
│   │   ├── ai/            # AI integration
│   │   ├── compliance/    # Compliance utilities
│   │   └── ...
│   ├── schemas/           # Zod validation schemas
│   ├── server/            # Server-side code
│   │   ├── api/           # tRPC routers
│   │   └── websocket/     # WebSocket handlers
│   ├── styles/            # Global styles
│   └── types/             # TypeScript type definitions
├── .env.example           # Environment template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to `main`

### Docker

```bash
# Build the image
docker build -t spac-os .

# Run the container
docker run -p 3000:3000 --env-file .env.local spac-os
```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## API Documentation

API documentation is available at `/api/docs` when running in development mode. The API follows RESTful conventions with additional tRPC endpoints for type-safe client-server communication.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/trpc/*` | tRPC API router |
| `POST /api/documents/upload` | Document upload |
| `GET /api/export` | Data export |
| `POST /api/webhooks/receive` | External webhooks |

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Pull request process
- Coding standards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.spacos.io](https://docs.spacos.io)
- **Issues**: [GitHub Issues](https://github.com/di-rezze-family-office/spac-os/issues)
- **Email**: support@spacos.io

---

<p align="center">
  Built with care by <a href="https://direzze.com">Di Rezze Family Office</a>
</p>
