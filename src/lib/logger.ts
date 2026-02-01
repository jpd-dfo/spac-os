/**
 * Logger utility for SPAC OS
 *
 * Provides environment-aware logging that suppresses debug output in production.
 * - info/debug/warn: Only log in development mode
 * - error: Always logs (errors should be visible in production for monitoring)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log informational messages (development only)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log error messages (always logs - needed for production monitoring)
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;
