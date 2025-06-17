import { describe, it, expect, test } from 'vitest';
import { sqlReader, SqlType } from './';
import { DbType } from 'schema/schema';

describe('SqlContentReader', () => {
  describe('getSqlContent', () => {
    test.each([
      ['mysql', 'ddl'],
      ['mysql', 'structure'],
      ['sqlserver', 'ddl'],
      ['sqlserver', 'structure'],
      ['postgres', 'ddl'],
      ['postgres', 'structure'],
    ] as [DbType, SqlType][])('should return SQL content for valid inputs', (dbType: DbType, sqlType: SqlType) => {
      const content = sqlReader.getSqlContent(dbType, sqlType);
      expect(content).toBeDefined();
    });

    it('should throw error for invalid database type', () => {
      // @ts-expect-error testing invalid input
      expect(() => sqlReader.getSqlContent('invalid', 'ddl')).toThrow(/Invalid database type/);
    });

    it('should throw error for invalid SQL type', () => {
      // @ts-expect-error testing invalid input
      expect(() => sqlReader.getSqlContent('mysql', 'invalid')).toThrow(/Invalid SQL type/);
    });
  });
});
