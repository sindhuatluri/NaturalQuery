import { readFileSync, existsSync, promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DbType } from 'schema/schema';

export type SqlType = 'ddl' | 'structure';

class SqlContentReader {
  private readonly basePath: string;

  constructor(basePath: string) {
    // Convert relative path to absolute path using import.meta.url
    const currentDir = dirname(fileURLToPath(import.meta.url));
    this.basePath = join(currentDir, basePath);
  }

  /**
   * Gets SQL content based on database type and SQL type
   */
  public getSqlContent(dbType: DbType, sqlType: SqlType): string {
    this.validateInputs(dbType, sqlType);

    try {
      const filePath = join(this.basePath, dbType, `${sqlType}.sql`);

      // Check if file exists
      if (!existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
      }

      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read SQL file for ${dbType}/${sqlType}: ${error}`);
    }
  }

  /**
   * Safe version of getSqlContent that returns null instead of throwing
   */
  public safeGetSqlContent(dbType: DbType, sqlType: SqlType): string | null {
    try {
      return this.getSqlContent(dbType, sqlType);
    } catch (error) {
      console.error(`Error: ${error}`);
      return null;
    }
  }

  /**
   * Validates the input parameters
   */
  private validateInputs(dbType: DbType, sqlType: SqlType): void {
    const validDbTypes: DbType[] = ['mssql', 'mysql', 'postgres'];
    const validSqlTypes: SqlType[] = ['ddl', 'structure'];

    if (!validDbTypes.includes(dbType)) {
      throw new Error(`Invalid database type. Must be one of: ${validDbTypes.join(', ')}`);
    }

    if (!validSqlTypes.includes(sqlType)) {
      throw new Error(`Invalid SQL type. Must be one of: ${validSqlTypes.join(', ')}`);
    }
  }

  /**
   * Asynchronous version of getSqlContent
   */
  public async getSqlContentAsync(dbType: DbType, sqlType: SqlType): Promise<string> {
    this.validateInputs(dbType, sqlType);

    try {
      const filePath = join(this.basePath, dbType, `${sqlType}.sql`);

      // Check if file exists using async exists check
      try {
        await fsPromises.access(filePath);
      } catch {
        throw new Error(`SQL file not found: ${filePath}`);
      }

      // Read file content asynchronously
      return await fsPromises.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read SQL file for ${dbType}/${sqlType}: ${error}`);
    }
  }
}

export const sqlReader = new SqlContentReader('./');
