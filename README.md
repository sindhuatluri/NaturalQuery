# Natural Query App

A modern web application built with Next.js and Bun runtime, using a monorepo structure.

## Prerequisites

- [Bun](https://bun.sh) v1.1.33 or higher
- Node.js 18+ (for certain dependencies)

## Project Structure

```
nq-app/
├── apps/
│   ├── api/    # Backend API service
│   └── web/    # Next.js frontend application
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nq-app
```

2. Install dependencies for all applications:
```bash
bun run install:all
```

## Development

You can run the development servers for both applications simultaneously:

```bash
bun run dev
```

Or run them separately:

- For the API:
```bash
bun run dev:api
```

- For the web application:
```bash
bun run dev:web
```

## Building for Production

Build all applications:
```bash
bun run build
```

Or build them separately:
```bash
bun run build:api    # Build API
bun run build:web    # Build web app
```

## Starting Production Servers

Start the API server:
```bash
bun run start:api
```

Start the web server:
```bash
bun run start:web
```

## Available Scripts

- `dev` - Run all applications in development mode
- `build` - Build all applications
- `clean` - Remove all node_modules and build directories
- `clean:install` - Clean and reinstall all dependencies
- `install:all` - Install dependencies for all applications
- `install:api` - Install API dependencies only
- `install:web` - Install web app dependencies only

## Environment Variables

### API Environment Variables (`apps/api/.env`)

Create a `.env` file in the `apps/api` directory with the following variables:

```env
PORT=3005                    # API server port
LOG_LEVEL=debug             # Logging level (debug, info, warn, error)
NODE_ENV=development        # Environment (development, production)
DATABASE_URL=               # PostgreSQL connection URL
CLERK_PUBLISHABLE_KEY=      # Clerk authentication public key
CLERK_SECRET_KEY=          # Clerk authentication secret key
REDIS_URL=                 # Redis connection URL
ANTHROPIC_API_KEY=         # Anthropic API key for AI features
OPENAI_API_KEY=            # OpenAI API key for AI features
```

### Web Environment Variables

The web application uses different environment files for development and production:

#### Development (`apps/web/.env.development`)
```env
ANTHROPIC_API_KEY=                     # Anthropic API key
CLERK_PUBLISHABLE_KEY=                 # Clerk authentication public key
CLERK_SECRET_KEY=                      # Clerk authentication secret key
NEXT_PUBLIC_API_URL=http://localhost:3005  # API URL for development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=     # Public-facing Clerk key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in # Clerk sign-in route
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up # Clerk sign-up route
```

#### Production (`apps/web/.env.production`)
```env
ANTHROPIC_API_KEY=                     # Anthropic API key
CLERK_PUBLISHABLE_KEY=                 # Clerk authentication public key
CLERK_SECRET_KEY=                      # Clerk authentication secret key
NEXT_PUBLIC_API_URL=                   # Production API URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=     # Public-facing Clerk key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in # Clerk sign-in route
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up # Clerk sign-up route
```

### Environment Setup Instructions

1. Copy the example environment files:
```bash
# For API
cp apps/api/.env.example apps/api/.env

# For Web
cp apps/web/.env.example apps/web/.env.development
cp apps/web/.env.example apps/web/.env.production
```

2. Fill in the environment variables with your actual values
3. Never commit the actual `.env` files to version control

## Tech Stack

### Frontend (Web)
- **Next.js 15**: React framework for production-grade applications with server-side rendering, routing, and build optimization
- **React 19 (RC)**: Latest version of React featuring improved performance and new features like automatic batching and transitions
- **TailwindCSS**: Utility-first CSS framework for rapid UI development with highly customizable design systems
- **Radix UI Components**: Unstyled, accessible component library providing robust primitives for building high-quality design systems
- **Clerk Authentication**: Full-featured auth and user management solution with pre-built components and APIs
- **React Query**: Powerful data synchronization library for managing, caching, and updating server state

### Backend (API)
- **Bun Runtime**: Modern JavaScript runtime with built-in bundler, test runner, and package manager offering superior performance
- **Hono**: Lightweight, ultrafast web framework for the edge, with excellent TypeScript support
- **DrizzleORM**: TypeScript ORM focusing on type safety and developer experience, with great performance characteristics
- **PostgreSQL**: Advanced open-source relational database with robust features for data integrity and complex queries
- **Redis (BullMQ)**: In-memory data store used with BullMQ for reliable job queuing and background processing
- **Clerk Authentication**: Backend integration for secure user authentication and session management

### Development Tools
- TypeScript for type-safe development
- ESLint and Prettier for code quality
- Monorepo structure using workspaces
- Docker for containerization
- GitHub Actions for CI/CD