/**
 * MatchDay Copilot — Logger Utility
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    if (isDev) console.warn(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
  },
};
