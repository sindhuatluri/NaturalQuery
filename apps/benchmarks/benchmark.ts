import { runBenchmark } from './src/benchmark';

// Parse command line arguments
const args = process.argv.slice(2);
const dbType = args[0] || 'postgres';
const modelType = args[1] || 'deepseek-coder-v2:latest';

if (!['postgres', 'mysql', 'mssql'].includes(dbType)) {
  console.error('Invalid database type. Supported types: postgres, mysql, mssql');
  process.exit(1);
}

// Run benchmark
runBenchmark(dbType, modelType).catch(console.error);
