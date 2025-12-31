// Système de logging sécurisé
// En production, les logs sensibles sont désactivés

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Formatte un message de log avec timestamp et contexte
 */
function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${dataStr}`;
}

/**
 * Sanitize les données sensibles avant de logger
 */
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'auth', 'authorization'];

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  /**
   * Log d'information - Toujours affiché
   */
  info(context: string, message: string, data?: unknown) {
    const sanitized = sanitizeData(data);
    console.log(formatMessage('info', context, message, sanitized));
  },

  /**
   * Log d'avertissement - Toujours affiché
   */
  warn(context: string, message: string, data?: unknown) {
    const sanitized = sanitizeData(data);
    console.warn(formatMessage('warn', context, message, sanitized));
  },

  /**
   * Log d'erreur - Toujours affiché
   * En production, masque les détails sensibles
   */
  error(context: string, message: string, error?: unknown) {
    if (isProd) {
      // En production, ne pas logger les stack traces complètes
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(formatMessage('error', context, message, { error: errorMsg }));
    } else {
      console.error(formatMessage('error', context, message, error));
    }
  },

  /**
   * Log de débogage - Uniquement en développement
   */
  debug(context: string, message: string, data?: unknown) {
    if (isDev) {
      const sanitized = sanitizeData(data);
      console.log(formatMessage('debug', context, message, sanitized));
    }
  },
};

/**
 * Helper pour logger les requêtes API
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  data?: unknown
) {
  logger.debug('API', `${method} ${path}`, {
    userId: userId || 'anonymous',
    data: sanitizeData(data),
  });
}

/**
 * Helper pour logger les erreurs API
 */
export function logApiError(
  method: string,
  path: string,
  error: unknown,
  userId?: string
) {
  logger.error('API', `${method} ${path} failed`, {
    userId: userId || 'anonymous',
    error: error instanceof Error ? {
      message: error.message,
      stack: isDev ? error.stack : undefined,
    } : error,
  });
}
