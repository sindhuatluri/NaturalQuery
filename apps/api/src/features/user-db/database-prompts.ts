import { PromptTemplate } from '@langchain/core/prompts';

export type VisualizationType = 'bar' | 'multiBar' | 'line' | 'pie' | 'area' | 'stackedArea' | 'table';
export type SqlDialect = 'oracle' | 'postgres' | 'sqlite' | 'mysql' | 'mssql';

const VISUALIZATION_GUIDE = `
Choose the most appropriate visualization type from:
- table: for raw data, detailed information, or multiple columns
- bar: for comparing single values across categories
- multiBar: for comparing multiple values across categories
- line: for showing trends over time or sequence
- pie: for showing parts of a whole (percentages)
- area: for showing cumulative totals over time
- stackedArea: for showing multiple cumulative totals over time
`;

const COMMON_INSTRUCTIONS = `
Given an input question, create a syntactically correct {dialect} query to run. Unless the user specifies in the question a specific number of examples to obtain, always limit your query to at most {top_k} results {limit_clause}. You can order the results to return the most informative data in the database.

Never query for all columns from a table; you must query only the columns that are needed to answer the question{identifier_instructions}.

Pay attention to use only the column names that you can see in the schema description. If the required tables or columns are not present in the schema, make reasonable assumptions or use placeholder names, and mention any assumptions in the explanation.

**Important Guidelines**:

- **Output Format**: Your final answer **must** be in the following format and **must not include any additional text outside this format**:

\`\`\`
explanation: [your explanation here]
query: [your SQL query here empty if no query can be made]
visualization: [suggested visualization type]
\`\`\`

- **Explanation Section**: Include any feedback, notes, or assumptions in the \`explanation\` section. Do **not** include any text outside the specified format.

${VISUALIZATION_GUIDE}

Only use the tables listed below:

{table_info}

Question: {input}
`;

const DIALECT_INSTRUCTIONS_MAP = {
  oracle: {
    intro: 'You are an ORACLE expert.',
    limit_clause: 'using the ROWNUM clause as per ORACLE',
    identifier_instructions: '',
    dialect: 'ORACLE',
  },
  postgres: {
    intro: 'You are a PostgreSQL expert.',
    limit_clause: 'using the LIMIT clause as per PostgreSQL',
    identifier_instructions: '. Wrap each column name in double quotes (") to denote them as delimited identifiers',
    dialect: 'PostgreSQL',
  },
  sqlite: {
    intro: 'You are a SQLite expert.',
    limit_clause: 'using the LIMIT clause as per SQLite',
    identifier_instructions: '. Wrap each column name in double quotes (") to denote them as delimited identifiers',
    dialect: 'SQLite',
  },
  mysql: {
    intro: 'You are a MySQL expert.',
    limit_clause: 'using the LIMIT clause as per MySQL',
    identifier_instructions: '. Wrap each column name in backticks (`) to denote them as delimited identifiers',
    dialect: 'MySQL',
  },
  mssql: {
    intro: 'You are an MS SQL expert.',
    limit_clause: 'using the TOP clause as per MS SQL',
    identifier_instructions: '. Wrap each column name in square brackets ([]) to denote them as delimited identifiers',
    dialect: 'MS SQL',
  },
};

function createPromptTemplate(dialect: SqlDialect): PromptTemplate {
  const dialectInstructions = DIALECT_INSTRUCTIONS_MAP[dialect];

  const template = `
${dialectInstructions.intro}

${COMMON_INSTRUCTIONS.replace(new RegExp('{dialect}', 'g'), dialectInstructions.dialect)
  .replace(new RegExp('{limit_clause}', 'g'), dialectInstructions.limit_clause)
  .replace(new RegExp('{identifier_instructions}', 'g'), dialectInstructions.identifier_instructions)}
`;
  return new PromptTemplate({
    template: template.trim(),
    inputVariables: ['table_info', 'input', 'top_k'],
  });
}

export const SQL_PROMPTS_MAP = {
  oracle: createPromptTemplate('oracle'),
  postgres: createPromptTemplate('postgres'),
  sqlite: createPromptTemplate('sqlite'),
  mysql: createPromptTemplate('mysql'),
  mssql: createPromptTemplate('mssql'),
};
