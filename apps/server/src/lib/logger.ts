/**
 * Logging service using Winston with custom format
 *
 * Format: [timestamp] [level] namespace: message
 * Example: [2024-01-15 10:30:45.123 +00] [INFO    ] canvas: Canvas layout saved successfully
 */
import winston from 'winston';

/**
 * Winston logger format configuration
 */
export const WINSTON_LOGGER_FORMAT = (colorize: boolean) =>
  winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS ZZ',
    }),
    ...(colorize ? [winston.format.colorize({ level: true })] : []),
    winston.format.printf((info) => {
      const { timestamp, level, message, namespace = 'global', ...meta } = info;
      const levelName = level.padEnd(8);
      let logMessage = `[${timestamp}] [${levelName}] ${namespace}: ${message}`;

      // Append metadata if present
      const metaKeys = Object.keys(meta);
      if (metaKeys.length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
      }

      return logMessage;
    }),
  );

interface iLoggerConfig {
  namespace: string;
  colorize?: boolean;
}

class Logger {
  private winstonLogger: winston.Logger;

  private namespace: string;

  constructor(config: iLoggerConfig) {
    this.namespace = config.namespace;
    const shouldColorize = config.colorize ?? process.env.NODE_ENV !== 'production';

    this.winstonLogger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: WINSTON_LOGGER_FORMAT(shouldColorize),
      transports: [new winston.transports.Console()],
      defaultMeta: { namespace: this.namespace },
    });
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.debug(message, meta);
  }

  /**
   * Create a child logger with a sub-namespace
   * Example: mainLogger.child('submodule') creates namespace 'main:submodule'
   */
  child(subNamespace: string): Logger {
    return new Logger({
      namespace: `${this.namespace}:${subNamespace}`,
      colorize: process.env.NODE_ENV !== 'production',
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
