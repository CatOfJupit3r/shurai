/**
 * Logging service using Winston with custom format
 *
 * Format: [timestamp] [level] namespace: message
 * Example: [2024-01-15 10:30:45.123 +00] [INFO    ] canvas: Canvas layout saved successfully
 */

// Note: Winston installation is currently blocked by a Bun package manager bug.
// This implementation provides the interface and will be migrated to Winston once available.
// For now, using console with the same format structure.

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface iLoggerConfig {
  namespace: string;
  colorize?: boolean;
}

class Logger {
  private namespace: string;

  private colorize: boolean;

  constructor(config: iLoggerConfig) {
    this.namespace = config.namespace;
    this.colorize = config.colorize ?? process.env.NODE_ENV !== 'production';
  }

  private formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    // Get timezone offset in format +HH:MM or -HH:MM
    const offset = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60)
      .toString()
      .padStart(2, '0');
    const offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
    const offsetSign = offset >= 0 ? '+' : '-';
    const timezone = `${offsetSign}${offsetHours}:${offsetMinutes}`;

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${timezone}`;
  }

  private formatLevel(level: LogLevel): string {
    const levelUpper = level.toUpperCase();
    return levelUpper.padEnd(8);
  }

  private colorizeLevel(level: LogLevel, text: string): string {
    if (!this.colorize) return text;

    const colors: Record<LogLevel, string> = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[32m', // Green
      debug: '\x1b[36m', // Cyan
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${text}${reset}`;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = this.formatTimestamp();
    const levelFormatted = this.formatLevel(level);
    const levelColored = this.colorizeLevel(level, levelFormatted);

    let logMessage = `[${timestamp}] [${levelColored}] ${this.namespace}: ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    // Map to appropriate console method
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](logMessage);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      this.log('debug', message, meta);
    }
  }

  /**
   * Create a child logger with a sub-namespace
   * Example: mainLogger.child('submodule') creates namespace 'main:submodule'
   */
  child(subNamespace: string): Logger {
    return new Logger({
      namespace: `${this.namespace}:${subNamespace}`,
      colorize: this.colorize,
    });
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new Logger({
  namespace: 'global',
  colorize: process.env.NODE_ENV !== 'production',
});

/**
 * Create a logger for a specific namespace
 */
export function createLogger(namespace: string): Logger {
  return new Logger({
    namespace,
    colorize: process.env.NODE_ENV !== 'production',
  });
}

export type { Logger, iLoggerConfig };
