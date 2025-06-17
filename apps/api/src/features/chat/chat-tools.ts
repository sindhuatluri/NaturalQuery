import Anthropic from '@anthropic-ai/sdk';

export const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'generate_graph_data',
    description: 'Generate structured JSON data for creating charts and graphs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chartType: {
          type: 'string' as const,
          enum: ['bar', 'multiBar', 'line', 'pie', 'area', 'stackedArea'] as const,
          description: 'The type of chart or table to generate',
        },
        config: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            description: { type: 'string' as const },
            trend: {
              type: 'object' as const,
              properties: {
                percentage: { type: 'number' as const },
                direction: {
                  type: 'string' as const,
                  enum: ['up', 'down'] as const,
                },
              },
              required: ['percentage', 'direction'],
            },
            footer: { type: 'string' as const },
            totalLabel: { type: 'string' as const },
            xAxisKey: { type: 'string' as const },
          },
          required: ['title', 'description'],
        },
        data: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            additionalProperties: true, // Allow any structure
          },
        },
        chartConfig: {
          type: 'object' as const,
          additionalProperties: {
            type: 'object' as const,
            properties: {
              label: { type: 'string' as const },
              stacked: { type: 'boolean' as const },
            },
            required: ['label'],
          },
        },
      },
      required: ['chartType', 'config', 'data', 'chartConfig'],
    },
  },
];
