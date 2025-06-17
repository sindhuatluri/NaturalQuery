import { serveUnauthorized } from '@/utils/responses';
import { getAuth } from '@hono/clerk-auth';
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

const validateUser = async (c: Context): Promise<boolean> => {
  const user = getAuth(c);

  if (!user?.userId) {
    return false;
  }

  c.set('user', user);
  return true;
};

export const authMiddleware = createMiddleware(async (c, next) => {
  const isValid = await validateUser(c);

  if (!isValid) {
    return serveUnauthorized(c);
  }

  await next();
});

type ClerkAuth = ReturnType<typeof getAuth>;

declare module 'hono' {
  interface ContextVariableMap {
    user: NonNullable<ClerkAuth>;
  }
}
