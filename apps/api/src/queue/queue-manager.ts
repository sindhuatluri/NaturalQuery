/**
 * Imports required dependencies for queue management and database operations.
 */
import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { JobType, JobData, GetConnectionDBStructureData, CheckDefaultUserConnectionData } from './types';
import { dbConnections, NewTableMetadata, NewUserPreferences, tableMetadata, userPreferences } from 'schema/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { sqlReader } from '@/features/user-db/sql';
import { DatabaseService } from '@/features/user-db/connection/database-service';
import { logger } from '@/lib/logger';
import env from '@/lib/env';

/**
 * AppQueue class implements a singleton pattern for managing job queues using BullMQ.
 * It handles job processing, queue management, and worker operations.
 */
export class AppQueue {
  private static instance: AppQueue;
  private declare queue: Queue;
  private declare worker: Worker;
  private isInitialized: boolean = false;
  private readonly QUEUE_NAME = 'app-queue';
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Returns whether the queue has been initialized.
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Gets the singleton instance of AppQueue.
   * Creates a new instance if one doesn't exist.
   */
  public static getInstance(): AppQueue {
    if (!AppQueue.instance) {
      AppQueue.instance = new AppQueue();
      logger.info('Created new AppQueue instance');
    }
    return AppQueue.instance;
  }

  /**
   * Initializes the queue with Redis configuration.
   * @param redisConfig - Redis connection options
   */
  public async initialize(
    redisConfig: ConnectionOptions = {
      url: env.REDIS_URL,
    },
  ): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize(redisConfig);
    return this.initializationPromise;
  }

  /**
   * Internal initialization method that sets up the queue and worker.
   * @param redisConfig - Redis connection options
   */
  private async _initialize(redisConfig: ConnectionOptions): Promise<void> {
    logger.info('Initializing queue...', {
      currentState: this.isInitialized,
      hasQueue: !!this.queue,
      hasWorker: !!this.worker,
    });

    if (this.isInitialized) {
      logger.warn('App queue is already initialized');
      return;
    }

    try {
      this.queue = new Queue(this.QUEUE_NAME, {
        connection: redisConfig,
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      this.worker = new Worker(this.QUEUE_NAME, async (job) => this.processJob(job), {
        connection: redisConfig,
        concurrency: 5,
      });

      this.setupEventListeners();
      this.isInitialized = true;

      // Verify initialization
      if (!(await this.healthCheck())) {
        throw new Error('Queue initialization verification failed');
      }

      logger.info('App queue initialized successfully', {
        hasQueue: !!this.queue,
        hasWorker: !!this.worker,
      });
    } catch (error) {
      this.isInitialized = false;
      this.initializationPromise = null;
      logger.error('Failed to initialize app queue:', error);
      throw error;
    }
  }

  /**
   * Checks if the queue and worker are healthy and connected to Redis.
   */
  public async healthCheck(): Promise<boolean> {
    if (!this.isInitialized || !this.queue || !this.worker) {
      logger.warn('Queue health check failed', {
        isInitialized: this.isInitialized,
        hasQueue: !!this.queue,
        hasWorker: !!this.worker,
      });
      return false;
    }

    try {
      const client = await this.queue.client;
      await client.ping();
      return true;
    } catch (error) {
      logger.error('Queue health check failed - Redis connection error:', error);
      return false;
    }
  }

  /**
   * Attempts to reconnect the queue by shutting down and reinitializing.
   */
  private async reconnect(): Promise<void> {
    logger.info('Attempting to reconnect queue...');

    try {
      await this.shutdown();
      await this.initialize();
    } catch (error) {
      logger.error('Queue reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Adds a new job to the queue with retry logic.
   * @param data - Job data to be processed
   * @param options - Optional job configuration
   * @param maxRetries - Maximum number of retry attempts
   */
  public async addJob<T extends JobData>(
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    },
    maxRetries = 3,
  ): Promise<Job<T>> {
    logger.info('Adding job to queue', {
      isInitialized: this.isInitialized,
      hasQueue: !!this.queue,
      jobType: data.type,
    });

    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        if (!this.isInitialized || !this.queue || !(await this.healthCheck())) {
          logger.warn('Queue not healthy, attempting reconnection...');
          await this.reconnect();
        }

        return await this.queue.add(data.type, data, {
          priority: options?.priority,
          delay: options?.delay,
          attempts: options?.attempts,
        });
      } catch (error) {
        attempts++;
        logger.error(`Failed to add job (attempt ${attempts}/${maxRetries}):`, error);

        if (attempts === maxRetries) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw new Error('Failed to add job after maximum retries');
  }

  /**
   * Processes incoming jobs based on their type.
   * @param job - Job to be processed
   */
  private async processJob(job: Job<JobData>): Promise<void> {
    logger.info(`Processing job ${job.id} of type ${job.data.type}`);

    try {
      switch (job.data.type) {
        case JobType.GET_CONNECTION_DB_STRUCTURE:
          return await this.handleGetConnectionDBStructure(job as Job<GetConnectionDBStructureData>);

        case JobType.CHECK_FOR_DEFAULT_USER_CONNECTION:
          return await this.handleCheckDefaultUserConnection(job as Job<CheckDefaultUserConnectionData>);

        default:
          const exhaustiveCheck: never = job.data;
          throw new Error(`Unhandled job type: ${exhaustiveCheck}`);
      }
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Sets up event listeners for the worker to track job progress and status.
   */
  private setupEventListeners(): void {
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed:`, error);
    });

    this.worker.on('error', (error) => {
      logger.error('Worker error:', error);
    });

    this.worker.on('active', (job) => {
      logger.info(`Job ${job.id} has started processing`);
    });

    this.worker.on('progress', (job, progress) => {
      logger.info(`Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Gracefully shuts down the queue and worker.
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.worker.close();
      await this.queue.close();
      this.isInitialized = false;
      this.initializationPromise = null;
      logger.info('App queue shut down successfully');
    } catch (error) {
      logger.error('Error shutting down app queue:', error);
      throw error;
    }
  }

  /**
   * Returns the queue instance if initialized.
   * @throws Error if queue is not initialized
   */
  public getQueue(): Queue {
    if (!this.isInitialized) {
      throw new Error('App queue is not initialized');
    }
    return this.queue;
  }

  /**
   * Returns the worker instance if initialized.
   * @throws Error if worker is not initialized
   */
  public getWorker(): Worker {
    if (!this.isInitialized) {
      throw new Error('App queue is not initialized');
    }
    return this.worker;
  }

  /**
   * Handles jobs that retrieve and store database structure for a connection.
   * @param job - Job containing connection details
   */
  private async handleGetConnectionDBStructure(job: Job<GetConnectionDBStructureData>): Promise<void> {
    const { connectionId } = job.data;
    try {
      const [connection] = await db.select().from(dbConnections).where(eq(dbConnections.id, connectionId)).limit(1);

      const dbService = DatabaseService.getInstance();
      const structure = await dbService.executeQuery(
        connection.id,
        sqlReader.getSqlContent(connection.type, 'structure'),
        connection.credentials,
      );

      const newMetadata: NewTableMetadata = {
        dbConnectionId: connection.id,
        ddl: JSON.stringify(structure),
        lastSync: new Date(),
      };

      logger.info(`Inserting metadata for connection ${connectionId}`, { data: structure });
      await db
        .insert(tableMetadata)
        .values(newMetadata)
        .onConflictDoUpdate({
          target: [tableMetadata.dbConnectionId],
          set: newMetadata,
        });
      await job.updateProgress(100);
    } catch (error) {
      logger.error(`Error in handleGetConnectionDBStructure: ${error}`, { error });
      throw error;
    }
  }

  /**
   * Sets the most recently created connection as the default for a user.
   * @param userId - ID of the user
   */
  private async setLatestConnectionAsDefault(userId: string) {
    const connections = await db.select().from(dbConnections).where(eq(dbConnections.ownerId, userId));

    if (connections.length === 0) {
      logger.info(`No connections found for user ${userId}`);
      return;
    }

    const latestConnection = connections.reduce((prev, current) =>
      prev.createdAt > current.createdAt ? prev : current,
    );

    logger.info(`Setting default connection for user ${userId} to ${latestConnection.id}`);

    const preferences: NewUserPreferences = {
      defaultDbConnection: latestConnection.id,
      userId,
    };

    await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({ target: [userPreferences.userId], set: preferences });
  }

  /**
   * Handles jobs that check and set default database connections for users.
   * @param job - Job containing user details
   */
  private async handleCheckDefaultUserConnection(job: Job<CheckDefaultUserConnectionData>): Promise<void> {
    const { userId } = job.data;
    try {
      const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

      if (!preferences || !preferences.defaultDbConnection) {
        await this.setLatestConnectionAsDefault(userId);
      } else {
        logger.info(`Default connection already set for user ${userId}`);
      }

      await job.updateProgress(100);
    } catch (error) {
      logger.error(`Error in handleCheckDefaultUserConnection: ${error}`);
      throw error;
    }
  }
}
