/**
 * Production-ready logger with environment-aware output
 * Guards console statements in production to prevent log spam
 * while maintaining error tracking capability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

function getDefaultLogLevel(): LogLevel {
  const env = String(process.env.LOG_LEVEL || '').toLowerCase();
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') return env as LogLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function safeStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'string') return value;
      return value;
    });
  } catch {
    try {
      return String(obj);
    } catch {
      return 'unserializable';
    }
  }
}

function redact(obj: unknown): unknown {
  // Shallow redact of common secret keys to avoid leaking secrets in logs
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      const lk = k.toLowerCase();
      if (lk.includes('token') || lk.includes('secret') || lk.includes('password') || lk.includes('apikey') || lk.includes('api_key') || lk.includes('authorization')) {
        out[k] = 'REDACTED';
      } else {
        out[k] = o[k];
      }
    }
    return out;
  }
  return obj;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const payload: Record<string, unknown> = {
    ts,
    level,
    message,
  };
  if (context) payload.context = redact(context);
  return payload;
}

function output(level: LogLevel, payload: Record<string, unknown>) {
  const str = safeStringify(payload);
  if (level === 'error') console.error(str);
  else if (level === 'warn') console.warn(str);
  else console.log(str);
}

export const logger = (() => {
  const configuredLevel = getDefaultLogLevel();

  function shouldLog(level: LogLevel) {
    return levelPriority[level] >= levelPriority[configuredLevel];
  }

  function makeChild(parentContext: Record<string, unknown> = {}) {
    return {
      debug(msg: string, context?: Record<string, unknown>) {
        if (!shouldLog('debug')) return;
        output('debug', formatLog('debug', msg, { ...parentContext, ...(context || {}) }));
      },
      info(msg: string, context?: Record<string, unknown>) {
        if (!shouldLog('info')) return;
        output('info', formatLog('info', msg, { ...parentContext, ...(context || {}) }));
      },
      warn(msg: string, context?: Record<string, unknown>) {
        if (!shouldLog('warn')) return;
        output('warn', formatLog('warn', msg, { ...parentContext, ...(context || {}) }));
      },
      error(msg: string, context?: Record<string, unknown>) {
        // Always log errors regardless of level - treat as critical
        output('error', formatLog('error', msg, { ...parentContext, ...(context || {}) }));
      },
      action(actionName: string, metadata?: Record<string, unknown>) {
        // Actions are 'info' level
        if (!shouldLog('info')) return;
        output('info', formatLog('info', `action:${actionName}`, { ...(parentContext || {}), ...(metadata || {}) }));
      },
      perf(label: string, duration: number, context?: Record<string, unknown>) {
        if (!shouldLog('info')) return;
        output('info', formatLog('info', `perf:${label}`, { duration, ...(parentContext || {}), ...(context || {}) }));
      },
      child: (ctx: Record<string, unknown> = {}) => makeChild({ ...parentContext, ...ctx }),
    };
  }

  return makeChild();
})();

export function generateRequestId(prefix = 'req') {
  const rnd = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}
