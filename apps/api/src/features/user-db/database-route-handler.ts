import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { DbConnection, dbConnections, DbCredentials } from 'schema/schema';
import { serveInternalServerError, serveNotFound, serveUnprocessableEntity } from '@/utils/responses';
import { db } from '@/lib/database';
import { DatabaseService } from './connection/database-service';
import { serializeDbConnectionRecord } from './serializer';
import { createDbConnectionSchema } from './database-schema';
import { authMiddleware } from '@/api/middlewares/authentication';
import { AppQueue } from '@/queue/queue-manager';
import { JobType } from '@/queue/types';
import { logger } from '@/lib/logger';
import { sqlReader } from './sql';

const dbConnectionRouter = new Hono();
const dbService = DatabaseService.getInstance();

dbConnectionRouter.use('*', authMiddleware);

dbConnectionRouter.get('/', async (c) => {
  try {
    const userId = c.get('user').userId as string;

    const connections = await db.select().from(dbConnections).where(eq(dbConnections.ownerId, userId));

    return c.json({
      success: true,
      data: connections.map(serializeDbConnectionRecord),
    });
  } catch (error) {
    return serveUnprocessableEntity(c, 'Failed to fetch connections');
  }
});

dbConnectionRouter.post('/', zValidator('json', createDbConnectionSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const userId = c.get('user').userId as string;

    const payload: DbConnection = {
      name: data.name,
      type: data.type,
      credentials: { ...(data.credentials as DbCredentials), type: data.type },
      isActive: true,
      ownerId: userId,
      lastConnectedAt: new Date(),
    };

    const isConnected = await dbService.testConnection(payload.credentials);

    if (!isConnected) {
      return serveUnprocessableEntity(c, 'Failed to connect to database');
    }

    const [connection] = await db.insert(dbConnections).values(payload).returning();

    const appQueue = AppQueue.getInstance();

    await appQueue.addJob({
      type: JobType.GET_CONNECTION_DB_STRUCTURE,
      connectionId: connection.id,
    });

    await appQueue.addJob({
      type: JobType.CHECK_FOR_DEFAULT_USER_CONNECTION,
      userId,
    });

    return c.json(
      {
        success: true,
        data: serializeDbConnectionRecord(connection),
      },
      200,
    );
  } catch (error) {
    console.log(error);
    return serveUnprocessableEntity(c, 'Failed to create connection');
  }
});

dbConnectionRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const connection = await db.select().from(dbConnections).where(eq(dbConnections.id, id)).limit(1);

    if (!connection.length) {
      throw new HTTPException(404, { message: 'Connection not found' });
    }

    // Check ownership
    if (connection[0].ownerId !== userId) {
      throw new HTTPException(403, { message: 'Unauthorized access' });
    }

    return c.json({
      success: true,
      data: serializeDbConnectionRecord(connection[0]),
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to fetch connection' });
  }
});

// Update a database connection
dbConnectionRouter.put('/:id', zValidator('json', createDbConnectionSchema.partial()), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;
    const updates = c.req.valid('json');

    const existing = await db.select().from(dbConnections).where(eq(dbConnections.id, id)).limit(1);

    if (!existing.length) {
      return serveNotFound(c);
    }

    if (existing[0].ownerId !== userId) {
      return serveNotFound(c);
    }

    const updated = await db
      .update(dbConnections)
      .set({
        ...(updates as Partial<DbConnection>),
        updatedAt: new Date(),
      })
      .where(eq(dbConnections.id, id))
      .returning();

    return c.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;

    return serveInternalServerError(c, 'Failed to update connection');
  }
});

dbConnectionRouter.post('/:id/test', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const [connection] = await db.select().from(dbConnections).where(eq(dbConnections.id, id)).limit(1);

    if (!connection) {
      return serveNotFound(c);
    }

    if (connection.ownerId !== userId) {
      return serveNotFound(c);
    }

    const testResult = await dbService.testConnection(connection.credentials);

    return c.json({
      success: true,
      data: {
        isConnected: testResult,
        message: testResult ? 'Connection successful' : 'Failed to connect to database',
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    return serveInternalServerError(c, 'Failed to test connection');
  }
});

dbConnectionRouter.get('/:id/structure', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const [connection] = await db.select().from(dbConnections).where(eq(dbConnections.id, id)).limit(1);

    if (!connection) {
      return serveNotFound(c);
    }

    if (connection.ownerId !== userId) {
      return serveNotFound(c);
    }

    const response: any = await dbService.executeQuery(
      connection.id,
      sqlReader.getSqlContent(connection.type, 'structure'),
      connection.credentials,
    );


    let structure = response.rows?.[0]?.['database_schema'];

    if (connection.type === 'mssql' && structure) {
      structure = { database_structure: JSON.parse(structure) };
    }

    return c.json({
      success: true,
      data: structure ?? { db_structure: [] },
    });
  } catch (error) {
    logger.error(error);
    if (error instanceof HTTPException) throw error;
    return serveInternalServerError(c, 'Failed to fetch structure');
  }
});

dbConnectionRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').userId as string;

    const [connection] = await db.select().from(dbConnections).where(eq(dbConnections.id, id)).limit(1);

    if (!connection) {
      return serveNotFound(c);
    }

    if (connection.ownerId !== userId) {
      return serveNotFound(c);
    }

    await db.delete(dbConnections).where(eq(dbConnections.id, id));

    return c.json({
      success: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    return serveInternalServerError(c, 'Failed to delete connection');
  }
});

export { dbConnectionRouter };
