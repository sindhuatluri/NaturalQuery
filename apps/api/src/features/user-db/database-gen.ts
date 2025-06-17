import { ChatAnthropic } from '@langchain/anthropic';
import { SqlDatabase } from 'langchain/sql_db';
import { DataSource } from 'typeorm';
import { DbCredentials } from 'schema/schema';
import Anthropic from '@anthropic-ai/sdk';
import { visualizationSystemPrompt } from '../chat/chat-prompt';
import { tools } from '../chat/chat-tools';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SQL_PROMPTS_MAP, VisualizationType } from './database-prompts';

/**
 * Extracts SQL query from a statement formatted as 'SQLQuery: "query"'
 * @param statement - The SQL statement string
 * @returns The extracted query or empty string if invalid format or N/A
 */
export function extractSql(text: string): string {
  const readKeywords = [
    'SELECT',
    'WITH',
    'EXPLAIN',
    'ANALYZE',
    'SHOW',
    'DESCRIBE',
    'DESC',
    'PREPARE',
    'VALUES',
    'TABLE',
  ];

  // Check for N/A case first
  if (text.match(/Query:\s*N\/A/i)) {
    return '';
  }

  // First remove the surrounding quotes if they exist
  let cleanText = text;
  const matches = text.match(/Query:\s*"(.+)"/);
  if (matches && matches[1]) {
    cleanText = matches[1];
  }

  const startIndex = readKeywords
    .map((keyword) => cleanText.indexOf(keyword))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  // If no valid SQL keywords found, return empty string
  if (startIndex === undefined) {
    return '';
  }

  let sql = cleanText.slice(startIndex);
  sql = sql.split('\n\n')[0];
  sql = sql.replace(/```/g, '');
  return sql.trim();
}

/**
 * List of valid visualization types supported by the application
 */
const VALID_VISUALIZATIONS: VisualizationType[] = ['bar', 'multiBar', 'line', 'pie', 'area', 'stackedArea', 'table'];

/**
 * Extracts visualization type from a text response
 * @param text - The text containing visualization information
 * @returns The extracted visualization type, defaults to 'table' if not found or invalid
 */
function extractVisualization(text: string): VisualizationType {
  // Default to table if no visualization is found
  const defaultViz: VisualizationType = 'table';

  // Extract text after "visualization:" or "Visualization:" (case insensitive)
  const vizMatch = text.match(/visualization:?(.*?)(?=explanation:|query:|$)/is);
  if (!vizMatch) return defaultViz;

  const vizText = vizMatch[1].toLowerCase().trim();

  // Find the first matching visualization type in the text
  const foundViz = VALID_VISUALIZATIONS.find((viz) => vizText.includes(viz.toLowerCase()));

  return foundViz || defaultViz;
}

/**
 * Extracts explanation text from a response
 * @param text - The text containing explanation information
 * @returns The extracted explanation or default message if not found
 */
function extractExplanation(text: string): string {
  const explanationMatch = text.match(/explanation:?(.*?)(?=visualization:|query:|$)/is);
  return explanationMatch ? explanationMatch[1].trim() : 'No explanation provided';
}

/**
 * Supported SQL dialect types
 */
export type SqlDialect = 'oracle' | 'postgres' | 'sqlite' | 'mysql' | 'mssql' | 'sap hana';

/**
 * Structure of SQL query generation response
 */
interface SqlResponse {
  explanation: string;
  query: string;
  visualization: VisualizationType;
}

/**
 * Configuration for retry attempts
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  initialDelay: 1000,
  maxDelay: 5000,
};

/**
 * Utility function to retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: (lastError?: Error) => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation(lastError);
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxAttempts) {
        throw error;
      }

      const delay = Math.min(config.initialDelay * Math.pow(2, attempt - 1), config.maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Generates an SQL query based on a natural language question
 * @param question - The natural language question to convert to SQL
 * @param dbConfig - Database connection configuration
 * @param topK - Number of top results to return (default: 50)
 * @param retryConfig - Retry configuration (optional)
 * @returns Promise resolving to SqlResponse containing query, explanation and visualization type
 * @throws Error if database connection fails or unsupported SQL dialect
 */
export async function generateSqlQuery(
  question: string,
  dbConfig: DbCredentials,
  topK: number = 50,
  retryConfig?: RetryConfig,
): Promise<SqlResponse> {
  return retryOperation(async (lastError?: Error) => {
    const llm = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      modelName: 'claude-3-5-sonnet-latest',
      temperature: 0.1,
    });

    const datasource = new DataSource({
      type: dbConfig.type as any,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      ...(dbConfig.type === 'mssql' && {
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
    });

    try {
      await datasource.initialize();

      const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
      });

      const dbSchema = await db.getTableInfo();

      // Get the appropriate SQL prompt template based on dialect
      const sqlPrompt = SQL_PROMPTS_MAP[dbConfig.type];
      if (!sqlPrompt) {
        throw new Error(`Unsupported SQL dialect: ${dbConfig.type}`);
      }

      const chain = sqlPrompt.pipe(llm).pipe(new StringOutputParser());

      // If there was a previous error, include it in the context
      const errorContext = lastError
        ? `\nPrevious attempt failed with error: ${lastError.message}\nPlease fix the query accordingly.`
        : '';

      const response = await chain.invoke({
        dialect: dbConfig.type,
        table_info: dbSchema,
        input: question + errorContext,
        top_k: topK,
      });

      const parsedResponse: SqlResponse = {
        explanation: extractExplanation(response),
        visualization: extractVisualization(response),
        query: extractSql(response) || '',
      };

      const validVisualizations: VisualizationType[] = [
        'bar',
        'multiBar',
        'line',
        'pie',
        'area',
        'stackedArea',
        'table',
      ];
      if (!validVisualizations.includes(parsedResponse.visualization)) {
        parsedResponse.visualization = 'table';
      }
      console.log('generated:', response);

      console.log('SQL query generated:', JSON.stringify(parsedResponse, null, 2));

      return parsedResponse;
    } finally {
      await datasource.destroy().catch(console.error);
    }
  }, retryConfig || DEFAULT_RETRY_CONFIG);
}

/**
 * Generates visualization data based on chat messages and query results
 * @param chatMessages - Array of chat messages
 * @param queryResults - Array of query results to visualize
 * @returns Promise resolving to visualization response from Anthropic API
 */
export const getVisualizations = async (chatMessages: any[], queryResults: any[]) => {
  const lastUserMessage = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `data contents for the request: ${JSON.stringify(queryResults)}`,
      },
      {
        type: 'text',
        text: chatMessages[chatMessages.length - 1].content,
      },
    ],
  };

  // @ts-ignore
  chatMessages[chatMessages.length - 1] = lastUserMessage;

  const chartResponse = await anthropic.messages.create({
    system: visualizationSystemPrompt,
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 4096,
    // @ts-ignore
    messages: chatMessages,
    temperature: 0,
    tools: tools,
    tool_choice: { type: 'tool', name: 'generate_graph_data' },
  });

  return chartResponse;
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
