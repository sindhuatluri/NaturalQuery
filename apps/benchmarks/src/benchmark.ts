import { ChatOllama } from "@langchain/ollama";
import { SqlDatabase } from 'langchain/sql_db';
import { StringOutputParser } from '@langchain/core/output_parsers';
import * as fs from 'fs';
import * as path from 'path';
import deepEqual from 'deep-equal';
import { BenchmarkResult } from './types';
import { BENCHMARK_CASES } from './test-data';
import { setupDatabase } from './db';
import { extractSql, normalizeResults } from './utils';
import { SQL_PROMPTS_MAP } from './prompts';

export async function runBenchmark(dbType: string = 'postgres', modelType: string = 'qwen2.5-coder:14b') {
  const results: BenchmarkResult[] = [];
  const datasource = await setupDatabase(dbType);

  const llm = new ChatOllama({
    model: modelType,
    baseUrl: "http://localhost:11434",
    temperature: 0,
  });

  try {
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: datasource,
    });
    let dbSchema: string
    if (dbType === 'mysql') {
      // reduce the number of tables to avoid timeout
      const tables = await datasource.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'mysql'
  AND table_name NOT IN (
    'columns_priv', 'component', 'db', 'default_roles', 'engine_cost',
    'func', 'general_log', 'global_grants', 'gtid_executed',
    'help_category', 'help_keyword', 'help_relation', 'help_topic',
    'innodb_index_stats', 'innodb_table_stats', 'ndb_binlog_index',
    'password_history', 'plugin', 'procs_priv', 'proxies_priv',
    'replication_asynchronous_connection_failover',
    'replication_asynchronous_connection_failover_managed',
    'replication_group_configuration_version',
    'replication_group_member_actions', 'role_edges', 'server_cost',
    'servers', 'slave_master_info', 'slave_relay_log_info',
    'slave_worker_info', 'slow_log', 'tables_priv', 'time_zone',
    'time_zone_leap_second', 'time_zone_name', 'time_zone_transition',
    'time_zone_transition_type', 'user'
  );
`);
      dbSchema = await db.getTableInfo(tables.map((t: any) => t['TABLE_NAME']));
    } else {
      dbSchema = await db.getTableInfo();
    }


    for (const testCase of BENCHMARK_CASES) {
      const startTime = Date.now();
      try {

        const chain = SQL_PROMPTS_MAP[dbType]
          // @ts-ignore
          .pipe(llm)
          // @ts-ignore
          .pipe(new StringOutputParser());


        const response = await chain.invoke({
          dialect: dbType,
          table_info: dbSchema,
          input: testCase.question,
          expected_structure: testCase.expectedStructure,
          top_k: 50
        });

        const generatedQuery = extractSql(response.trim());
        console.log('Generated Query:', generatedQuery);

        // Execute query and normalize results
        const queryResults = await datasource.query(generatedQuery);
        const generatedResults = normalizeResults(queryResults);
        const expectedResults = normalizeResults(testCase.expectedResult);

        // Compare results using deep-equal
        const resultsMatch = deepEqual(generatedResults, expectedResults, { strict: true });

        // Additional check for column names
        const columnsMatch = Object.keys(generatedResults[0] || {}).sort().join(',') ===
          Object.keys(expectedResults[0] || {}).sort().join(',');

        const success = resultsMatch && columnsMatch;

        results.push({
          caseName: testCase.name,
          success,
          generatedQuery,
          expectedQuery: testCase.expectedQuery,
          executionTime: Date.now() - startTime,
          matchScore: success ? 1 : 0,
          generatedResults,
          expectedResults,
          columnsMatch,
          dataMatch: resultsMatch
        });

      } catch (error) {
        console.error(`Error in test case ${testCase.name}:`, error);
        results.push({
          caseName: testCase.name,
          success: false,
          generatedQuery: '',
          expectedQuery: testCase.expectedQuery,
          executionTime: Date.now() - startTime,
          error: `${error}`,
          matchScore: 0,
          generatedResults: [],
          expectedResults: testCase.expectedResult
        });
      }
    }
  } finally {
    await datasource.destroy();
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    databaseType: dbType,
    modelType: modelType,
    totalCases: results.length,
    successfulCases: results.filter(r => r.success).length,
    averageExecutionTime: results.reduce((acc, r) => acc + r.executionTime, 0) / results.length,
    results: results.map(r => ({
      ...r,
      generatedResults: r.generatedResults,
      expectedResults: r.expectedResults
    }))
  };

  // Save report
  const reportPath = path.join(__dirname, '..', 'benchmark-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath);
  }

  fs.writeFileSync(
    path.join(reportPath, `report-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log('\nBenchmark Summary:');
  console.log('=================');
  console.log(`Database Type: ${report.databaseType}`);
  console.log(`Model Type: ${report.modelType}`);
  console.log(`Total Cases: ${report.totalCases}`);
  console.log(`Successful Cases: ${report.successfulCases}`);
  console.log(`Success Rate: ${((report.successfulCases / report.totalCases) * 100).toFixed(2)}%`);
  console.log(`Average Execution Time: ${report.averageExecutionTime.toFixed(2)}ms`);

  // Print detailed results
  console.log('\nDetailed Results:');
  console.log('================');
  results.forEach(result => {
    console.log(`\nTest Case: ${result.caseName}`);
    console.log(`Success: ${result.success}`);
    console.log(`Columns Match: ${result.columnsMatch}`);
    console.log(`Data Match: ${result.dataMatch}`);
    console.log(`Execution Time: ${result.executionTime}ms`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log('Generated Query:', result.generatedQuery);
      console.log('Generated Results:', JSON.stringify(result.generatedResults, null, 2));
      console.log('Expected Results:', JSON.stringify(result.expectedResults, null, 2));
    }
  });
}
