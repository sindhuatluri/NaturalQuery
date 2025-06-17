export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: Array<{ name: string; type: string }>;
}
