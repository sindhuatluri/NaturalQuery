import env from '@/lib/env';
import { AppQueue } from './queue-manager';
import { logger } from '@/lib/logger';

let globalInitializationPromise: Promise<void> | null = null;

export async function initializeQueue() {
  if (globalInitializationPromise) {
    return globalInitializationPromise;
  }

  globalInitializationPromise = (async () => {
    const appQueue = AppQueue.getInstance();

    try {
      await appQueue.initialize({
        url: env.REDIS_URL,
      });

      logger.info('Queue initialization completed and verified');
    } catch (error) {
      globalInitializationPromise = null;
      logger.error('Queue initialization failed:', error);
      throw error;
    }
  })();

  return globalInitializationPromise;
}

export async function shutdownQueue() {
  const appQueue = AppQueue.getInstance();
  await appQueue.shutdown();
  globalInitializationPromise = null;
}
