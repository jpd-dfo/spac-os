# Contributing to SPAC OS

Thank you for your interest in contributing to SPAC OS! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect everyone participating in this project to:

- Be respectful and inclusive
- Exercise empathy and kindness
- Give and gracefully accept constructive feedback
- Focus on what is best for the community and project
- Show courtesy and respect to other community members

### Unacceptable Behavior

- Harassment, discrimination, or intimidation of any kind
- Trolling, insulting/derogatory comments, and personal attacks
- Publishing others' private information without permission
- Any conduct that could reasonably be considered inappropriate

## Getting Started

### Prerequisites

1. **Node.js** 18.17.0 or higher
2. **pnpm** package manager (recommended)
3. **PostgreSQL** 14 or higher
4. **Git** for version control

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/spac-os.git
   cd spac-os
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/di-rezze-family-office/spac-os.git
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your local configuration.

6. **Initialize the database**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

7. **Start the development server**
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/` - New features (e.g., `feature/add-document-preview`)
- `fix/` - Bug fixes (e.g., `fix/pipeline-sorting-issue`)
- `refactor/` - Code refactoring (e.g., `refactor/optimize-query-performance`)
- `docs/` - Documentation updates (e.g., `docs/update-api-reference`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create a new branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write your code** following our [coding standards](#coding-standards)
2. **Add tests** for new functionality
3. **Update documentation** if necessary
4. **Run linting and tests** before committing

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Format code
pnpm format
```

## Pull Request Process

### Before Submitting

1. Ensure your code follows the project's coding standards
2. Run all tests and ensure they pass
3. Update documentation if you've changed APIs or added features
4. Rebase your branch on the latest `main`

### Submitting a Pull Request

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub from your branch to `main`

3. **Fill out the PR template** completely:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Testing instructions

4. **Request review** from maintainers

### PR Review Process

- At least one maintainer must approve the PR
- All CI checks must pass
- Address all review feedback
- Squash commits if requested

### After Merge

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Sync with upstream
git checkout main
git pull upstream main
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type; use proper typing
- Use interfaces for object shapes
- Export types from dedicated type files

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use descriptive prop names
- Implement proper error boundaries

```typescript
// Component structure
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md',
        variant === 'primary' && 'bg-primary-600 text-white',
        variant === 'secondary' && 'bg-secondary-200 text-secondary-900'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### File Organization

```
src/
├── components/
│   └── ComponentName/
│       ├── index.ts          # Exports
│       ├── ComponentName.tsx # Main component
│       ├── ComponentName.test.tsx # Tests
│       └── types.ts          # Component-specific types
```

### Styling

- Use Tailwind CSS for styling
- Follow the design system color tokens
- Use `cn()` utility for conditional classes
- Avoid inline styles

### API Routes

- Use proper HTTP methods
- Implement error handling
- Validate input with Zod schemas
- Return consistent response formats

```typescript
// Good API response format
return NextResponse.json({
  success: true,
  data: result,
});

// Error response
return NextResponse.json(
  { success: false, error: 'Error message' },
  { status: 400 }
);
```

## Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(pipeline): add drag-and-drop card reordering

fix(auth): resolve session timeout issue

docs(api): update endpoint documentation

refactor(components): extract shared button styles
```

### Commit Best Practices

- Keep commits atomic and focused
- Write clear, descriptive messages
- Reference issues when applicable (`fixes #123`)
- Sign commits when possible

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write unit tests for utilities and hooks
- Write integration tests for API routes
- Write component tests for UI components
- Aim for meaningful coverage, not just high numbers

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Include examples in documentation

```typescript
/**
 * Calculates the redemption percentage for a SPAC.
 *
 * @param trustValue - Total trust value in dollars
 * @param redeemedShares - Number of shares redeemed
 * @param totalShares - Total outstanding shares
 * @returns Redemption percentage as a decimal (0-1)
 *
 * @example
 * const percentage = calculateRedemptionPercentage(100000000, 5000000, 10000000);
 * // Returns 0.5 (50%)
 */
export function calculateRedemptionPercentage(
  trustValue: number,
  redeemedShares: number,
  totalShares: number
): number {
  // Implementation
}
```

### README Updates

If your changes affect:
- Installation process
- Environment variables
- Available scripts
- API endpoints

Please update the README accordingly.

## Questions?

If you have questions about contributing:

1. Check existing [issues](https://github.com/di-rezze-family-office/spac-os/issues) and [discussions](https://github.com/di-rezze-family-office/spac-os/discussions)
2. Open a new discussion for general questions
3. Open an issue for bug reports or feature requests

---

Thank you for contributing to SPAC OS! Your contributions help make this project better for everyone.
