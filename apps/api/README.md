# Backend API

This is the backend API service built with Hono.js, TypeScript, and BullMQ for job processing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun runtime
- Redis (for BullMQ job processing)
- PostgreSQL database

### Installation

1. Install dependencies:

```
bun install
```

2. Set up your environment variables (create a `.env` file in the root):

```env
PORT=3005                    # API server port
LOG_LEVEL=debug             # Logging level (debug, info, warn, error)
NODE_ENV=development        # Environment (development/production)
DATABASE_URL=               # PostgreSQL connection URL
CLERK_PUBLISHABLE_KEY=     # Clerk public key
CLERK_SECRET_KEY=          # Clerk secret key
REDIS_URL=                 # Redis connection URL
ANTHROPIC_API_KEY=         # Anthropic AI API key
OPENAI_API_KEY=            # OpenAI API key
```

## 📜 Available Scripts

- `bun run dev` - Start the development server with hot reload and pretty logging
- `bun run build` - Build the TypeScript project
- `bun run start` - Start the production server
- `bun run test:unit` - Run unit tests with Vitest
- `bun run format` - Format code with Prettier

### Database Scripts
- `bun run db:generate` - Generate database migrations with Drizzle
- `bun run db:migrate` - Run database migrations
- `bun run db:drop` - Drop database schema

## 🏗️ Project Structure

```
src/
├── features/        # Feature-specific modules
├── lib/            # Shared utilities and configurations
│   ├── constants.ts    # Application constants
│   ├── database.ts     # Database configuration
│   ├── env.ts         # Environment variable validation
│   └── logger.ts      # Pino logger setup
├── queue/          # BullMQ job processing setup
│   ├── setup.ts       # Queue initialization
│   ├── types.ts       # Queue type definitions
│   └── queue-manager.ts # Queue management utilities
└── index.ts        # Application entry point
```

## 🔑 Key Features

- **Authentication** - Secure authentication using Clerk
- **Job Processing** - Robust background job processing with BullMQ
- **Database** - PostgreSQL with Drizzle ORM for type-safe queries
- **Logging** - Structured logging with Pino
- **Type Safety** - Full TypeScript support with Zod validation
- **AI Integration** - Support for both Anthropic and OpenAI

## 🛠️ Technologies

- [Hono.js](https://hono.dev/) - Fast, lightweight web framework
- [BullMQ](https://docs.bullmq.io/) - Redis-based queue for background jobs
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Clerk](https://clerk.com/) - Authentication and user management
- [Pino](https://getpino.io/) - Fast and low overhead logging
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|-----------|---------|
| PORT | API server port | No | 3005 |
| LOG_LEVEL | Logging level (debug, info, warn, error) | No | debug |
| NODE_ENV | Environment (development/production) | No | development |
| DATABASE_URL | PostgreSQL connection URL | Yes | - |
| CLERK_PUBLISHABLE_KEY | Clerk public key for authentication | Yes | - |
| CLERK_SECRET_KEY | Clerk secret key for authentication | Yes | - |
| REDIS_URL | Redis connection URL | Yes | - |
| ANTHROPIC_API_KEY | API key for Anthropic AI services | Yes | - |
| OPENAI_API_KEY | API key for OpenAI services | Yes | - |

## 🧪 Testing

The project uses Vitest for unit testing. Test files are located alongside the code they test.

```bash
# Run unit tests
bun run test:unit

# Setup test environment
bun run test:setup

# Teardown test environment
bun run test:teardown
```

## 📦 Dependencies

Key dependencies include:
- `@anthropic-ai/sdk` and `@langchain/anthropic` for AI capabilities
- `@clerk/backend` and `@hono/clerk-auth` for authentication
- `bullmq` and `ioredis` for job queue management
- `drizzle-orm` for database operations
- `hono` for the web framework
- `pino` for logging
- `zod` for validation

For a complete list of dependencies, see `package.json`.

## 🤝 Contributing

1. Make sure to run tests before submitting PRs
2. Follow the existing code style and formatting guidelines
3. Update documentation for any new features
4. Add appropriate test coverage for new code

## 📄 License

This project is proprietary and confidential.