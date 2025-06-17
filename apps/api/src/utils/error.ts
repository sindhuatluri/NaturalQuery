export const getMessageFromError = (error: unknown): string =>
  error && typeof error === 'object' && 'message' in error ? (error.message as string) : `${error}`;
