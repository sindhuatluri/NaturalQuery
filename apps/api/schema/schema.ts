import { pgTable, text, timestamp, jsonb, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { relations, type InferInsertModel } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

/**
 * Database credential types and interfaces
 */
export const DB_TYPES = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  SQLSERVER: 'mssql',
  ORACLE: 'oracle',
  SQLITE: 'sqlite',
} as const;

export type DbType = (typeof DB_TYPES)[keyof typeof DB_TYPES];

interface BaseDbCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface PostgresCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.POSTGRES;
  schema?: string;
}

export interface MySQLCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.MYSQL;
}

export interface SQLServerCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.SQLSERVER;
  domain?: string;
  trustServerCertificate?: boolean; // Skip SSL verification
  encrypt?: boolean; // Enable/disable encryption
  instanceName?: string;
}

export type DbCredentials = PostgresCredentials | MySQLCredentials | SQLServerCredentials;

/**
 * Database connections table - Stores connection information
 */
export const dbConnections = pgTable('db_connections', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).$type<DbType>().notNull(),
  credentials: jsonb('credentials').$type<DbCredentials>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lastConnectedAt: timestamp('last_connected_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Users table - Stores core user information
 */
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Chats table - Stores chat sessions
 */
export const chats = pgTable('chats', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  dbConnectionId: text('db_connection_id')
    .notNull()
    .references(() => dbConnections.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  isArchived: boolean('is_archived').default(false).notNull(),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Update messages table to add proper foreign key
 */
export const messages = pgTable('messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  chatId: text('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content').notNull(),
  chartData: jsonb('chart_data').$type<ChartData>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Saved queries - Stores reusable queries
 */
export const savedQueries = pgTable('saved_queries', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  dbConnectionId: text('db_connection_id')
    .notNull()
    .references(() => dbConnections.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  naturalLanguageQuery: text('natural_language_query').notNull(),
  sqlQuery: text('sql_query').notNull(),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Query executions - Stores all query execution details
 */
export const queryExecutions = pgTable('query_executions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  savedQueryId: text('saved_query_id').references(() => savedQueries.id, { onDelete: 'set null' }),
  dbConnectionId: text('db_connection_id')
    .notNull()
    .references(() => dbConnections.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  sqlQuery: text('sql_query').notNull(),
  executionTime: integer('execution_time'),
  status: varchar('status', { length: 50 }).$type<QueryStatus>().notNull(),
  error: text('error'),
  result: jsonb('result'),
  rowsAffected: integer('rows_affected'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Table metadata - Stores database table information
 */
export const tableMetadata = pgTable('table_metadata', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  dbConnectionId: text('db_connection_id')
    .notNull()
    .references(() => dbConnections.id, { onDelete: 'cascade' })
    .unique(),
  ddl: text('ddl').notNull(),
  description: text('description'),
  lastSync: timestamp('last_sync').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User preferences - Stores user settings
 */
export const userPreferences = pgTable('user_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  defaultDbConnection: text('default_db_connection').references(() => dbConnections.id, { onDelete: 'set null' }),
  theme: varchar('theme', { length: 50 }).default('light'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations configuration
 */

/**
 * Update dbConnections relations to include chats
 */
export const dbConnectionsRelations = relations(dbConnections, ({ many, one }) => ({
  tableMetadata: many(tableMetadata),
  savedQueries: many(savedQueries),
  queryExecutions: many(queryExecutions),
  chats: many(chats),
  owner: one(users, {
    fields: [dbConnections.ownerId],
    references: [users.id],
  }),
}));

/**
 * Users relations
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  dbConnections: many(dbConnections),
  savedQueries: many(savedQueries),
  queryExecutions: many(queryExecutions),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

/**
 * Chat relations
 */
export const chatsRelations = relations(chats, ({ many, one }) => ({
  messages: many(messages),
  dbConnection: one(dbConnections, {
    fields: [chats.dbConnectionId],
    references: [dbConnections.id],
  }),
  owner: one(users, {
    fields: [chats.ownerId],
    references: [users.id],
  }),
}));

/**
 * Update messages relations to include chat
 */
export const messagesRelations = relations(messages, ({ many, one }) => ({
  queryExecutions: many(queryExecutions),
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

/**
 * Saved queries relations
 */
export const savedQueriesRelations = relations(savedQueries, ({ one, many }) => ({
  dbConnection: one(dbConnections, {
    fields: [savedQueries.dbConnectionId],
    references: [dbConnections.id],
  }),
  owner: one(users, {
    fields: [savedQueries.ownerId],
    references: [users.id],
  }),
  queryExecutions: many(queryExecutions),
}));

/**
 * Query executions relations
 */
export const queryExecutionsRelations = relations(queryExecutions, ({ one }) => ({
  message: one(messages, {
    fields: [queryExecutions.messageId],
    references: [messages.id],
  }),
  savedQuery: one(savedQueries, {
    fields: [queryExecutions.savedQueryId],
    references: [savedQueries.id],
  }),
  dbConnection: one(dbConnections, {
    fields: [queryExecutions.dbConnectionId],
    references: [dbConnections.id],
  }),
  owner: one(users, {
    fields: [queryExecutions.ownerId],
    references: [users.id],
  }),
}));

/**
 * Table metadata relations
 */
export const tableMetadataRelations = relations(tableMetadata, ({ one }) => ({
  dbConnection: one(dbConnections, {
    fields: [tableMetadata.dbConnectionId],
    references: [dbConnections.id],
  }),
}));

/**
 * User preferences relations
 */
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
  defaultConnection: one(dbConnections, {
    fields: [userPreferences.defaultDbConnection],
    references: [dbConnections.id],
  }),
}));

/**
 * Type exports for use in application code
 */

export type Chat = InferInsertModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

export type User = InferInsertModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type DbConnection = InferInsertModel<typeof dbConnections>;
export type NewDbConnection = InferInsertModel<typeof dbConnections>;

export type Message = InferInsertModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type SavedQuery = InferInsertModel<typeof savedQueries>;
export type NewSavedQuery = InferInsertModel<typeof savedQueries>;

export type QueryExecution = InferInsertModel<typeof queryExecutions>;
export type NewQueryExecution = InferInsertModel<typeof queryExecutions>;

export type TableMetadata = InferInsertModel<typeof tableMetadata>;
export type NewTableMetadata = InferInsertModel<typeof tableMetadata>;

export type UserPreferences = InferInsertModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;

/**
 * Enum types for status and roles
 */
export const QUERY_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type QueryStatus = (typeof QUERY_STATUS)[keyof typeof QUERY_STATUS];

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];

/**
 * Metadata types for better type safety
 */
export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  references?: {
    table: string;
    column: string;
  };
  defaultValue?: unknown;
  description?: string;
}

export interface TableMetadataType {
  columns: ColumnMetadata[];
  primaryKeys: string[];
  foreignKeys: Array<{
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }>;
  indices: Array<{
    name: string;
    columns: string[];
    isUnique: boolean;
  }>;
  description?: string;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    stacked?: boolean;
    color?: string;
  };
}

export interface ChartData {
  chartType: string;
  config: {
    title: string;
    description: string;
    trend?: {
      percentage: number;
      direction: 'up' | 'down';
    };
    footer?: string;
    totalLabel?: string;
    xAxisKey?: string;
  };
  data: Array<Record<string, any>>;
  chartConfig: ChartConfig;
}

export interface ToolUse {
  name: string;
  parameters: Record<string, unknown>;
  result: unknown;
  error?: string;
  executionTime?: number;
}

export interface NotificationSettings {
  queryCompletion: boolean;
  errorAlerts: boolean;
  performanceAlerts: boolean;
  thresholds?: {
    executionTime?: number;
    rowsAffected?: number;
  };
}
