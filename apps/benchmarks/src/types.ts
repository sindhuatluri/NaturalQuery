export interface BenchmarkCase {
  name: string;
  question: string;
  expectedQuery: string;
  expectedResult: any[];
  expectedStructure: string;
}

export interface BenchmarkResult {
  caseName: string;
  success: boolean;
  generatedQuery: string;
  expectedQuery: string;
  executionTime: number;
  error?: string;
  matchScore: number;
  generatedResults?: any[];
  expectedResults?: any[];
  columnsMatch?: boolean;
  dataMatch?: boolean;
}
