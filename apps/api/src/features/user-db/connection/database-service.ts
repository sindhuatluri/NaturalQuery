import { DbCredentials } from 'schema/schema';
import { QueryResult } from '../drivers/types';
import { DataSource, DataSourceOptions } from 'typeorm';
import env from '@/lib/env';

interface ConnectionPool {
  dataSource: DataSource;
  lastUsed: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private connections: Map<string, ConnectionPool> = new Map();
  private readonly CLEANUP_INTERVAL = 1000 * 60; // 1 minute
  private readonly CONNECTION_TIMEOUT = 1000 * 60 * 5; // 5 minutes

  private constructor() {
    setInterval(() => this.cleanupInactiveConnections(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async getOrCreateConnection(connectionId: string, credentials?: DbCredentials): Promise<DataSource> {
    const existing = this.connections.get(connectionId);
    if (existing && existing.dataSource.isInitialized) {
      // Verify the connection is still alive
      try {
        await existing.dataSource.query('SELECT 1');
        existing.lastUsed = Date.now();
        return existing.dataSource;
      } catch (error) {
        console.warn(`Connection ${connectionId} appears initialized but failed health check, reconnecting...`);
        // Connection is stale, close it and recreate
        await this.closeConnection(connectionId);
      }
    }

    if (!credentials) {
      throw new Error('Credentials required for new connection');
    }

    // Close existing connection if it exists but isn't initialized
    if (existing) {
      try {
        await this.closeConnection(connectionId);
      } catch (error) {
        console.warn(`Failed to close existing connection: ${error}`);
      }
    }

    const options: DataSourceOptions = {
      name: connectionId,
      type: credentials.type as any,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      database: credentials.database,
      synchronize: false,
      logging: env.NODE_ENV === 'development',
      ...(credentials.type === 'mssql' && {
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
      connectTimeout: 30000, // 30 seconds timeout
    };

    try {
      const dataSource = new DataSource(options);
      await dataSource.initialize();

      if (!dataSource.isInitialized) {
        throw new Error('Failed to initialize connection');
      }

      this.connections.set(connectionId, {
        dataSource,
        lastUsed: Date.now(),
      });

      return dataSource;
    } catch (error) {
      console.error(`Failed to create connection: ${error}`);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  private async cleanupInactiveConnections(): Promise<void> {
    const now = Date.now();
    const connectionPromises = Array.from(this.connections.entries()).map(async ([connectionId, pool]) => {
      if (now - pool.lastUsed > this.CONNECTION_TIMEOUT) {
        await this.closeConnection(connectionId);
      }
    });
    await Promise.all(connectionPromises);
  }

  async executeQuery(connectionId: string, sql: string, credentials?: DbCredentials): Promise<QueryResult> {
    try {
      const dataSource = await this.getOrCreateConnection(connectionId, credentials);

      if (!dataSource.isInitialized) {
        throw new Error('Database connection is not initialized');
      }

      const result = await dataSource.query(sql);

      return {
        rows: result,
        rowCount: Array.isArray(result) ? result.length : 0,
        fields:
          Array.isArray(result) && result.length > 0
            ? Object.keys(result[0]).map((key) => ({
                name: key,
                type: typeof result[0][key],
              }))
            : [],
      };
    } catch (error) {
      console.error(`Query execution failed:`, error);
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        if (connection.dataSource.isInitialized) {
          await connection.dataSource.destroy();
        }
      } catch (error) {
        console.error(`Error closing connection: ${error}`);
      } finally {
        this.connections.delete(connectionId);
      }
    }
  }

  async testConnection(credentials: DbCredentials): Promise<boolean> {
    const testConnectionId = `test-${Date.now()}`;
    try {
      const dataSource = await this.getOrCreateConnection(testConnectionId, credentials);
      await dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error(`Connection test failed: ${error}`);
      return false;
    } finally {
      await this.closeConnection(testConnectionId);
    }
  }

  // Add method to close all connections
  async closeAllConnections(): Promise<void> {
    const connectionPromises = Array.from(this.connections.keys()).map((connectionId) =>
      this.closeConnection(connectionId),
    );
    await Promise.all(connectionPromises);
  }
}
