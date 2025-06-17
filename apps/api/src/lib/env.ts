import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test', 'ci']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  ANTHROPIC_API_KEY: z.string(),
});

export default envSchema.parse(process.env);
