const LOG_PREFIX = '[SellSnap]';

type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, module: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `${LOG_PREFIX}[${module}][${level.toUpperCase()}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  const line = `${timestamp} ${prefix} ${message}${metaStr}`;

  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') console.debug(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  info: (module: string, message: string, meta?: Record<string, unknown>) => log('info', module, message, meta),
  warn: (module: string, message: string, meta?: Record<string, unknown>) => log('warn', module, message, meta),
  error: (module: string, message: string, meta?: Record<string, unknown>) => log('error', module, message, meta),
  debug: (module: string, message: string, meta?: Record<string, unknown>) => log('debug', module, message, meta),
};
