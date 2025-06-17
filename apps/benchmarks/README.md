# Natural Query Language Benchmarks

This project provides a comprehensive benchmarking suite for testing natural language to SQL query generation across different language models and database types.

## Purpose

The benchmark suite aims to:
- Evaluate the accuracy of natural language to SQL query generation
- Compare performance across different Ollama models
- Test compatibility with multiple database types (PostgreSQL, MySQL, MS SQL Server)
- Measure execution time and result accuracy
- Generate detailed reports for analysis

## Prerequisites

- Node.js and npm/yarn installed
- Ollama installed and running locally
- Access to at least one of the following databases:
  - PostgreSQL
  - MySQL
  - Microsoft SQL Server

## Database Setup

The benchmark supports PostgreSQL, MySQL, and Microsoft SQL Server. You can use Docker to quickly set up all databases:

```bash
# Start all databases
docker-compose up -d

# Check the status of the databases
docker-compose ps

# Stop all databases
docker-compose down
```

Default database credentials:
- PostgreSQL:
  - Host: localhost
  - Port: 5432
  - Username: postgres
  - Password: password
  - Database: postgres

- MySQL:
  - Host: localhost
  - Port: 3306
  - Username: root
  - Password: password
  - Database: mysql

- Microsoft SQL Server:
  - Host: localhost
  - Port: 1433
  - Username: sa
  - Password: YourStrong@Passw0rd
  - Database: master

## Configuration

Update the database configurations in `benchmark.ts` to match your local database settings:

```typescript
const DB_CONFIGS = {
  postgres: {
    // Update these values
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'benchmark_db'
  },
  // ... other database configs
}
```

## Running Benchmarks

Basic usage:
```bash
# Install dependencies
npm install

# Run with default settings (llama2 model, PostgreSQL)
npm run benchmark

# Run with specific model and database
npm run benchmark postgres llama2

```

You can run benchmarks against different databases and models:

```bash
# Run with PostgreSQL (default)
npm run benchmark

# Run with MySQL
npm run benchmark mysql deepseek-coder-v2:latest

# Run with Microsoft SQL Server
npm run benchmark mssql deepseek-coder-v2:latest
```

Available options:
- `--model, -m`: Ollama model to use (default: 'llama2')
- `--db, -d`: Database type ('postgres', 'mysql', or 'mssql')
- `--temperature, -t`: Model temperature (default: 0)

## Benchmark Results

Results are saved in the `benchmark-reports` directory with the following naming format:
```
benchmark_[database]_[model]_[timestamp].json
```

Each report includes:
- Generated SQL queries
- Expected queries
- Execution times
- Success/failure status
- Match scores
- Error messages (if any)
