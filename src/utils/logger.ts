/**
 * Simple logger utility for consistent logging across the app
 */

const LOG_ENABLED = __DEV__;

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (LOG_ENABLED) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (LOG_ENABLED) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, error?: Error | unknown, ...args: unknown[]) => {
    if (LOG_ENABLED) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (LOG_ENABLED) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};
