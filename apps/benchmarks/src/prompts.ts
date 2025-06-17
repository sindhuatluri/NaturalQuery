import { PromptTemplate } from "@langchain/core/prompts";

export const SQL_PROMPTS_MAP: Record<string, PromptTemplate> = {
  postgres: PromptTemplate.fromTemplate(`
You are an expert PostgreSQL query generator.

Database Schema:
{table_info}

Important Rules:
1. ALWAYS return the exact same columns as shown in the example result
2. Use LEFT JOIN when counting or summing to include rows with zero values
3. Do NOT use double quotes around table or column names
4. Return ONLY the SQL query, no explanations

Question: {input}

Example Result Structure:
{expected_structure}

Query:`),
  mysql: PromptTemplate.fromTemplate(`
You are an expert MySQL query generator.

Database Schema:
{table_info}

Important Rules:
1. ALWAYS return the exact same columns as shown in the example result
2. Use LEFT JOIN when counting or summing to include rows with zero values
3. Use backticks (\`) for table and column names if needed
4. Return ONLY the SQL query, no explanations

Question: {input}

Example Result Structure:
{expected_structure}

Query:`),
  mssql: PromptTemplate.fromTemplate(`
You are an expert Microsoft SQL Server query generator.

Database Schema:
{table_info}

Important Rules:
1. ALWAYS return the exact same columns as shown in the example result
2. Use LEFT JOIN when counting or summing to include rows with zero values
3. Use square brackets ([]) for table and column names if needed
4. Return ONLY the SQL query, no explanations

Question: {input}

Example Result Structure:
{expected_structure}

Query:`),
};
