import { Webhook } from 'svix';
import { Context, Hono } from 'hono';
import { WebhookEvent } from '@clerk/backend';
import { db } from '@/lib/database';
import { users } from 'schema/schema';
import { UserCreated } from './webhook-types';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const webhookRouter = new Hono();

webhookRouter.post('/clerk', async (c: Context) => {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const svix_id = c.req.header('svix-id');
  const svix_timestamp = c.req.header('svix-timestamp');
  const svix_signature = c.req.header('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json({ error: 'Error occured -- no svix headers' }, 400);
  }

  // Get the body
  const payload = await c.req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error('Error verifying webhook:', err);
    return c.json({ error: 'Error occured' }, 400);
  }

  const { id } = evt.data;
  const eventType = evt.type;

  const data = payload as UserCreated;

  const [user] = await db.select().from(users).where(eq(users.email, data.data.email_addresses[0].email_address));

  if (user) {
    return c.json({ message: 'user already exists' }, 200);
  }

  await db.insert(users).values({
    id,
    name: `${data.data.first_name} ${data.data.last_name}`,
    email: data.data.email_addresses[0].email_address,
  });

  logger.info(`Webhook with and ID of ${id} and type of ${eventType}`);

  return c.json({ message: 'success' }, 200);
});
