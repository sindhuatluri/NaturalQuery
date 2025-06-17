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

export function normalizeResults(results: any[]): any[] {
  return results.map(row => {
    const normalized: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Handle numeric strings
      if (typeof value === 'string' && !isNaN(Number(value))) {
        normalized[key] = Number(parseFloat(value).toFixed(2));
      }
      // Handle null values
      else if (value === null) {
        normalized[key] = 0;
      }
      // Keep other values as is
      else {
        normalized[key] = value;
      }
    }
    return normalized;
  }).sort((a, b) => {
    // Sort by first key to ensure consistent ordering
    const firstKey = Object.keys(a)[0];
    return a[firstKey] < b[firstKey] ? -1 : 1;
  });
}
