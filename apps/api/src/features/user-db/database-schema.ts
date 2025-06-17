import { z } from 'zod';

export const createDbConnectionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['postgres', 'mysql', 'mssql']),
  credentials: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    database: z.string().min(1),
    username: z.string().min(1),
    password: z.string(),
    ssl: z
      .object({
        mode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']),
        ca: z.string().optional(),
        cert: z.string().optional(),
        key: z.string().optional(),
      })
      .optional(),
  }),
  description: z.string().optional(),
});
