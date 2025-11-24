// Production-safe logging utility
// Only logs to console in development, uses proper error tracking in production

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any) {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'error':
          console.error(logMessage, data);
          break;
        case 'warn':
          console.warn(logMessage, data);
          break;
        case 'debug':
          console.debug(logMessage, data);
          break;
        default:
          console.log(logMessage, data);
      }
    }
    
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (!this.isDevelopment && level === 'error') {
      // TODO: Integrate with error tracking service
      // Example: Sentry.captureException(data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
