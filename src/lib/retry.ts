import { warn } from './logger.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseMs: number,
  label: string,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const delay = (1 << attempt) * baseMs;
        const reason =
          lastError instanceof HttpError ? `HTTP ${lastError.status}` : lastError.message;
        warn(`${label} ... retry ${attempt + 1}/${maxRetries} (${reason})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
