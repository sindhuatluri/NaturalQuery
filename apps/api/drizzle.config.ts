import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import env from './src/lib/env';

export default defineConfig({
  schema: './schema/schema.ts',
  out: './schema/migration',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL as string,
  },
  verbose: true,
});
