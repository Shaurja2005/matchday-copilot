/**
 * MatchDay Copilot — Logger Utility
 *
 * A structured logger wrapping console methods.
 * In production, replace with winston or pino for JSON-structured logs and
 * log-level filtering. Using console here avoids a heavyweight dependency
 * in a demo environment while maintaining a consistent logging API.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Log informational messages. Only emitted in non-production environments
   * to keep production output clean.
   */
  info: (message: string, ...args: unknown[]): void => {
    if (isDev) console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
  },

  /**
   * Log warnings. Emitted in all environments to surface potential issues.
   */
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
  },

  /**
   * Log errors. Always emitted; used for unexpected failures that need operator attention.
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
  },
};
