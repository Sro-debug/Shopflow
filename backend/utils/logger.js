/**
 * Simple structured logger
 * Usage: logger.info('Gateway', 'Server started', { port: 5000 })
 */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = {
  debug: '\x1b[36m', info: '\x1b[32m',
  warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m',
};

const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL || 'info'];

function log(level, service, message, meta = null) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
  console[level === 'error' ? 'error' : 'log'](
    `${color}[${level.toUpperCase()}]${COLORS.reset} ${ts} [${service}] ${message}${metaStr}`
  );
}

const logger = {
  debug: (s, m, meta) => log('debug', s, m, meta),
  info:  (s, m, meta) => log('info',  s, m, meta),
  warn:  (s, m, meta) => log('warn',  s, m, meta),
  error: (s, m, meta) => log('error', s, m, meta),
};

module.exports = logger;
