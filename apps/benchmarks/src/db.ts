import { DataSource } from 'typeorm';
import { SCHEMA_SETUP, TEST_DATA } from './test-data';

const DB_CONFIG = {
  postgres: {
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'postgres',
  },
  mysql: {
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'mysql',
  },
  mssql: {
    port: 1433,
    username: 'sa',
    password: 'YourStrong@Passw0rd',
    database: 'master',
  },
};

export async function setupDatabase(dbType: string = 'postgres'): Promise<DataSource> {
  const config = DB_CONFIG[dbType as keyof typeof DB_CONFIG];
  
  const datasource = new DataSource({
    type: dbType as any,
    host: 'localhost',
    ...config,
    synchronize: false,
    ...(dbType === 'mssql' && {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),
  });

  await datasource.initialize();

  try {
    // Drop existing tables if they exist
    const DROP_STATEMENTS = {
      postgres: [
        `DROP TABLE IF EXISTS order_items CASCADE;`,
        `DROP TABLE IF EXISTS orders CASCADE;`,
        `DROP TABLE IF EXISTS products CASCADE;`,
        `DROP TABLE IF EXISTS customers CASCADE;`,
      ],
      
      mysql: [
        `SET FOREIGN_KEY_CHECKS = 0;`,
        `DROP TABLE IF EXISTS order_items;`,
        `DROP TABLE IF EXISTS orders;`,
        `DROP TABLE IF EXISTS products;`,
        `DROP TABLE IF EXISTS customers;`,
        `SET FOREIGN_KEY_CHECKS = 1;`
      ],
      
      mssql: [`
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_items]') AND type in (N'U'))
          DROP TABLE [dbo].[order_items];
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[orders]') AND type in (N'U'))
          DROP TABLE [dbo].[orders];
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
          DROP TABLE [dbo].[products];
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customers]') AND type in (N'U'))
          DROP TABLE [dbo].[customers];
      `]
    };
    const dropStatements = DROP_STATEMENTS[dbType as keyof typeof DROP_STATEMENTS];
    for (const statement of dropStatements) {
      await datasource.query(statement);
    }
    // Create tables using database-specific schema
    const schema = SCHEMA_SETUP[dbType as keyof typeof SCHEMA_SETUP];
    if (Array.isArray(schema)) {
      // Handle MySQL's separate statements
      for (const statement of schema) {
        await datasource.query(statement);
      }
    } else {
      await datasource.query(schema);
    }
    
    // Insert test data
    const testData = TEST_DATA[dbType as keyof typeof TEST_DATA];
    if (Array.isArray(testData)) {
      // Handle MySQL's separate statements
      for (const statement of testData) {
        await datasource.query(statement);
      }
    } else {
      await datasource.query(testData);
    }

    return datasource;
  } catch (error) {
    console.error(`Error setting up ${dbType} database:`, error);
    await datasource.destroy();
    throw error;
  }
}
