import { z } from 'zod';

export const postChatHandlerSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    }),
  ),
  page: z.number().optional().default(1),
  itemsPerPage: z.number().optional().default(50),
  chatId: z.string().optional(),
  dbConnectionId: z.string().optional(),
});

export const sqlResponseSchema = z.object({
  metadata: z.object({
    tables: z.array(z.string()),
    type: z.enum(['aggregate', 'transaction', 'time-series', 'comparison']),
    metrics: z.array(z.string()),
    isTableView: z.boolean(),
    visualization: z.string().nullable(),
  }),
  query: z.string(),
  config: z.object({
    title: z.string(),
    description: z.string(),
  }),
  tableConfig: z.record(
    z.string(),
    z.object({
      label: z.string(),
    }),
  ),
});

export const chartResponseSchema = z.object({
  chartType: z.string(),
  config: z.object({
    title: z.string(),
    description: z.string(),
    xAxisKey: z.string(),
    trend: z
      .object({
        percentage: z.number(),
        direction: z.enum(['up', 'down']),
      })
      .optional(),
  }),
  data: z.array(z.record(z.any())),
  chartConfig: z.record(
    z.object({
      label: z.string(),
    }),
  ),
});
