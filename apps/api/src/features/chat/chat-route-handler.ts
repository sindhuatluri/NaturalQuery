import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/database';
import {
  messages,
  queryExecutions,
  dbConnections,
  QUERY_STATUS,
  MESSAGE_ROLES,
  type NewMessage,
  type NewQueryExecution,
  type NewChat,
  userPreferences,
  DbConnection,
  chats,
} from '../../../schema/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getMessageFromError } from '@/utils/error';
import { serveInternalServerError, serveNotFound } from '@/utils/responses';
import { Hono } from 'hono';
import { DatabaseService } from '../user-db/connection/database-service';
import { postChatHandlerSchema } from './chat-validation';
import { authMiddleware } from '@/api/middlewares/authentication';
import { zValidator } from '@hono/zod-validator';
import { logger } from '@/lib/logger';
import { ChartData } from './chat-types';
import { generateSqlQuery, getVisualizations, retryOperation } from '../user-db/database-gen';
import { streamText } from 'hono/streaming';
import { transformPieChartArray } from '@/utils/arr';

const databaseService = DatabaseService.getInstance();

type RequestBody = z.infer<typeof postChatHandlerSchema>;

interface StreamResponse {
  type: 'sql-query' | 'sql-results' | 'visualization' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

export const chatRouter = new Hono();

chatRouter.use('*', authMiddleware);

chatRouter.post('/message', zValidator('json', postChatHandlerSchema), async (c) => {
  return streamText(c, async (stream) => {
    const sendStreamResponse = async (type: StreamResponse['type'], data: any) => {
      await stream.write(
        JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
        } as StreamResponse) + '\n',
      );
    };
    try {
      const { messages: chatMessages, dbConnectionId, chatId } = (await c.req.json()) as RequestBody;
      const userId = c.get('user').userId as string;
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');
      c.header('Transfer-Encoding', 'chunked');

      let activeChatId: string | undefined;
      let activeConnectionId: string;
      let connection: DbConnection;

      if (chatId) {
        const existingChat = await db.query.chats.findFirst({
          where: eq(chats.id, chatId),
          columns: {
            id: true,
            ownerId: true,
            dbConnectionId: true,
          },
        });

        if (!existingChat) {
          await sendStreamResponse('error', { message: 'Chat not found', code: 404 });
          return;
        }

        if (existingChat.ownerId !== userId) {
          await sendStreamResponse('error', { message: 'Unauthorized access to chat', code: 403 });
          return;
        }

        activeChatId = chatId;
        activeConnectionId = existingChat.dbConnectionId;
      } else {
        if (dbConnectionId) {
          const connectionExists = await db.query.dbConnections.findFirst({
            where: and(eq(dbConnections.id, dbConnectionId), eq(dbConnections.ownerId, userId)),
          });

          if (!connectionExists) {
            await sendStreamResponse('error', { message: 'Invalid database connection ID', code: 400 });
            return;
          }

          activeConnectionId = dbConnectionId;
        } else {
          const preferences = await db.select().from(userPreferences).where(eq(userPreferences.id, userId));
          const defaultConnectionId = preferences?.[0]?.defaultDbConnection;

          if (!defaultConnectionId) {
            await sendStreamResponse('error', {
              message: 'Database connection ID is required for new chat',
              code: 400,
            });
            return;
          }

          activeConnectionId = defaultConnectionId;
        }
      }

      const connectionData = await db.query.dbConnections.findFirst({
        where: and(eq(dbConnections.id, activeConnectionId), eq(dbConnections.ownerId, userId)),
      });

      if (!connectionData) {
        await sendStreamResponse('error', { message: 'Unauthorized access to database connection', code: 403 });
        return;
      }

      connection = connectionData;

      if (!chatId) {
        const newChat: NewChat = {
          ownerId: userId,
          dbConnectionId: activeConnectionId,
          name: chatMessages?.[0]?.content?.slice(0, 50) + '...',
          lastMessageAt: new Date(),
        };

        const [createdChat] = await db.insert(chats).values(newChat).returning();
        activeChatId = createdChat.id;
      }

      if (!activeChatId) {
        await sendStreamResponse('error', { message: 'Failed to create or retrieve chat ID', code: 500 });
        return;
      }

      const newMessage: NewMessage = {
        chatId: activeChatId,
        role: MESSAGE_ROLES.USER,
        content: chatMessages[chatMessages.length - 1].content,
      };

      await db.insert(messages).values(newMessage).returning();

      const sqlResponse = await generateSqlQuery(chatMessages[chatMessages.length - 1].content, connection.credentials);
      logger.info(`SQL query generated: ${sqlResponse.query}`);

      await sendStreamResponse('sql-query', {
        query: sqlResponse.query,
        content: sqlResponse.explanation,
      });

      if (!sqlResponse.query) {
        await Promise.all([
          db.insert(messages).values({
            chatId: activeChatId,
            role: MESSAGE_ROLES.ASSISTANT,
            content: sqlResponse.explanation || 'Failed to generate SQL query',
          }),
          db.update(chats).set({ lastMessageAt: new Date(), name: 'New Chat' }).where(eq(chats.id, activeChatId)),
        ]);

        await sendStreamResponse('error', {
          message: sqlResponse.explanation || 'Failed to generate SQL query',
          code: 400,
        });
        return;
      }

      const [savedAiMessage] = await db
        .insert(messages)
        .values({
          chatId: activeChatId,
          role: MESSAGE_ROLES.ASSISTANT,
          content: sqlResponse.explanation,
        })
        .returning();

      const newQueryExecution: NewQueryExecution = {
        messageId: savedAiMessage.id,
        dbConnectionId: activeConnectionId,
        ownerId: userId,
        sqlQuery: sqlResponse.query,
        status: QUERY_STATUS.RUNNING,
      };

      const [queryExecution] = await db.insert(queryExecutions).values(newQueryExecution).returning();

      try {
        const queryResults = await retryOperation(async (lastError?: Error) => {
          if (lastError) {
            // If there was an error, try to generate a new query with the error context
            const newSqlResponse = await generateSqlQuery(
              chatMessages[chatMessages.length - 1].content,
              connection.credentials,
              50,
              { maxAttempts: 1, initialDelay: 0, maxDelay: 0 }, // Don't retry the regeneration
            );

            if (newSqlResponse.query) {
              await db
                .update(queryExecutions)
                .set({ sqlQuery: newSqlResponse.query })
                .where(eq(queryExecutions.id, queryExecution.id));

              sqlResponse.query = newSqlResponse.query;
            }
          }

          return await databaseService.executeQuery(activeConnectionId, sqlResponse.query, connection.credentials);
        });

        await sendStreamResponse('sql-results', {
          results: queryResults.rows,
          executionTime: Date.now() - new Date(queryExecution.createdAt).getTime(),
        });

        await db
          .update(queryExecutions)
          .set({
            status: QUERY_STATUS.COMPLETED,
            result: queryResults?.rows ?? [],
            rowsAffected: queryResults?.rows.length ?? 0,
          })
          .where(eq(queryExecutions.id, queryExecution.id));

        if (!sqlResponse.visualization || sqlResponse.visualization === 'table' || !queryResults.rows.length) {
          await sendStreamResponse('complete', {
            chatId: activeChatId,
            dbId: activeConnectionId,
          });

          return;
        }

        const chartResponse = await getVisualizations(chatMessages, queryResults.rows);
        const toolUseContent = chartResponse.content.find((c) => c.type === 'tool_use');

        if (!toolUseContent?.input) {
          await sendStreamResponse('error', { message: 'No visualization generated', code: 500 });
          return;
        }

        const processChartConfig = (data: ChartData) => {
          const chartData = { ...data };

          if (!chartData.chartType || !chartData.data || !Array.isArray(chartData.data)) {
            throw new Error('Invalid chart data structure');
          }

          if (chartData.chartType === 'pie') {
            chartData.data = transformPieChartArray(chartData.data);

            chartData.config.xAxisKey = 'segment';
          }

          return Object.entries(chartData.chartConfig).reduce(
            (acc, [key, config]: [string, any], index) => ({
              ...acc,
              [key]: {
                ...config,
                color: `hsl(var(--chart-${index + 1}))`,
              },
            }),
            {},
          );
        };

        const chartResult = toolUseContent.input as ChartData;
        const processedChart = {
          ...chartResult,
          ...(chartResult.chartType === 'pie' && { data: transformPieChartArray(chartResult.data) }),
          chartConfig: processChartConfig(chartResult),
        };

        await sendStreamResponse('visualization', {
          chartData: processedChart,
          content: chartResponse.content.find((c) => c.type === 'text')?.text || '',
        });

        await Promise.all([
          db
            .update(messages)
            .set({
              chartData: processedChart,
            })
            .where(eq(messages.id, savedAiMessage.id)),
          db
            .update(chats)
            .set({
              lastMessageAt: new Date(),
              name: processedChart.config?.title ?? 'New Chat',
            })
            .where(eq(chats.id, activeChatId)),
        ]);

        await sendStreamResponse('complete', {
          chatId: activeChatId,
          dbId: activeConnectionId,
        });
      } catch (queryError) {
        await db
          .update(queryExecutions)
          .set({
            status: QUERY_STATUS.FAILED,
            error: getMessageFromError(queryError),
            executionTime: Date.now() - new Date(queryExecution.createdAt).getTime(),
          })
          .where(eq(queryExecutions.id, queryExecution.id));

        await sendStreamResponse('error', {
          message: getMessageFromError(queryError),
          phase: 'query-execution',
          code: 500,
        });
      }
    } catch (error) {
      logger.error('Request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof z.ZodError) {
        await sendStreamResponse('error', {
          type: 'validation_error',
          errors: error.errors,
          code: 422,
        });
        return;
      }

      if (error instanceof Anthropic.APIError) {
        await sendStreamResponse('error', {
          type: 'ai_error',
          message: error.message,
          status: error.status,
          code: error.status,
        });
        return;
      }

      await sendStreamResponse('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'general_error',
        code: 500,
      });
    }
  });
});

chatRouter.get('/', async (c) => {
  try {
    const userId = c.get('user').userId as string;
    const chatsData = await db
      .select({
        id: chats.id,
        name: chats.name,
        createdAt: chats.createdAt,
        lastMessageAt: chats.lastMessageAt,
        dbConnectionId: chats.dbConnectionId,
      })
      .from(chats)
      .where(eq(chats.ownerId, userId))
      .orderBy(desc(chats.lastMessageAt));

    return c.json({
      success: true,
      data: chatsData,
    });
  } catch (error) {
    serveInternalServerError(c, 'Failed to fetch chats');
  }
});

chatRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const chatResult = await db
      .select({
        chatId: chats.id,
        chatName: chats.name,
        dbConnectionId: chats.dbConnectionId,
        ownerId: chats.ownerId,
        isArchived: chats.isArchived,
        lastMessageAt: chats.lastMessageAt,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.ownerId, userId)))
      .limit(1);

    const chat = chatResult[0];

    if (!chat) {
      return serveNotFound(c);
    }

    const messagesResult = await db
      .select({
        id: messages.id,
        content: messages.content,
        role: messages.role,
        chartData: messages.chartData,
        sqlQuery: queryExecutions.sqlQuery,
        data: queryExecutions.result,
      })
      .from(messages)
      .leftJoin(queryExecutions, eq(messages.id, queryExecutions.messageId))
      .where(eq(messages.chatId, id))
      .orderBy(asc(messages.createdAt));

    return c.json({
      success: true,
      data: {
        chat,
        messages: messagesResult,
      },
    });
  } catch (error) {
    serveInternalServerError(c, 'Failed to fetch chat');
  }
});

chatRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.ownerId, userId)));

    if (!chat) {
      return c.json(
        {
          error: 'Chat not found',
        },
        404,
      );
    }

    try {
      await db.delete(chats).where(eq(chats.id, chat.id));
    } catch (error) {
      console.log(error);
      return c.json(
        {
          error: 'Failed to delete chat',
        },
        500,
      );
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    serveInternalServerError(c, 'Failed to delete chat');
  }
});
