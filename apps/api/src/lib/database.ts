import { Logger as drizzleLogger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../schema/schema';
import env from './env';
import { logger } from './logger';
import { remember } from '../utils/remember';

const DB_ERRORS = {
  DUPLICATE_KEY: '23505', // PostgreSQL unique violation error code
};

export interface DatabaseError {
  type: string;
  message: string;
  stack?: string;
  code: string;
  severity: string;
  detail: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

class DBLogger implements drizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    logger.debug({ query, params });
  }
}

const client = postgres(env.DATABASE_URL);

const db = remember('db', () => drizzle(client, { schema: schema, logger: new DBLogger() }));

export type DB = typeof db;

export { DB_ERRORS, client, db };
