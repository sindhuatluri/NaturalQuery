import { DbConnection } from 'schema/schema';

export const serializeDbConnectionRecord = (connectionRecord: DbConnection): Record<string, unknown> => ({
  id: connectionRecord.id,
  name: connectionRecord.name,
  type: connectionRecord.type,
  isActive: connectionRecord.isActive,
  lastConnectedAt: connectionRecord.lastConnectedAt,
  createdAt: connectionRecord.createdAt,
  updatedAt: connectionRecord.updatedAt,
});
