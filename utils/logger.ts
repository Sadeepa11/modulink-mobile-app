// ============================================================
// Logger utility
// All console output goes through here so you can:
//   • See timestamps on every log line
//   • Grep the Metro console by prefix  (e.g. "[API]", "[SOCKET]")
//   • Disable ALL logs in one place for production
//
// Usage:
//   import Logger from '@/utils/logger';
//   Logger.api.request('POST', '/auth/login', { email });
//   Logger.api.response(200, { token: '...' });
//   Logger.api.error(401, 'Invalid credentials', '/auth/login');
//   Logger.socket('send_message', { conversationId: 1 });
//   Logger.auth('user logged in', { id: 1 });
//   Logger.error('Something broke', errorObject);
//   Logger.info('App started');
// ============================================================

// Set to false to silence logs completely (e.g. in a production build)
const ENABLED = true;

// Truncate long values so console output stays readable
const MAX_LEN = 300;
function truncate(value: unknown): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (!str) return '(empty)';
  return str.length > MAX_LEN ? str.slice(0, MAX_LEN) + `… [+${str.length - MAX_LEN} chars]` : str;
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

// ── API ──────────────────────────────────────────────────────
const api = {
  /** Log an outgoing HTTP request */
  request(method: string, url: string, data?: unknown) {
    if (!ENABLED) return;
    const body = data ? `\n   Body: ${truncate(data)}` : '';
    console.log(`[API ↑ ${timestamp()}] ${method.toUpperCase()} ${url}${body}`);
  },

  /** Log a successful HTTP response */
  response(status: number, url: string, data?: unknown) {
    if (!ENABLED) return;
    const payload = data !== undefined ? `\n   Data: ${truncate(data)}` : '';
    console.log(`[API ↓ ${timestamp()}] ${status} ${url}${payload}`);
  },

  /** Log a failed HTTP response */
  error(status: number | string, url: string, message: string, data?: unknown) {
    if (!ENABLED) return;
    const extra = data !== undefined ? `\n   Response: ${truncate(data)}` : '';
    console.error(`[API ✖ ${timestamp()}] ${status} ${url} — ${message}${extra}`);
  },
};

// ── Socket.IO ────────────────────────────────────────────────
function socket(event: string, payload?: unknown) {
  if (!ENABLED) return;
  const data = payload !== undefined ? ` | ${truncate(payload)}` : '';
  console.log(`[SOCKET ${timestamp()}] ${event}${data}`);
}

// ── Auth ─────────────────────────────────────────────────────
function auth(action: string, detail?: unknown) {
  if (!ENABLED) return;
  const extra = detail !== undefined ? ` | ${truncate(detail)}` : '';
  console.log(`[AUTH ${timestamp()}] ${action}${extra}`);
}

// ── General error ────────────────────────────────────────────
function error(message: string, err?: unknown) {
  if (!ENABLED) return;
  if (err instanceof Error) {
    console.error(`[ERROR ${timestamp()}] ${message}\n   ${err.message}`, err.stack ?? '');
  } else if (err !== undefined) {
    console.error(`[ERROR ${timestamp()}] ${message}\n   ${truncate(err)}`);
  } else {
    console.error(`[ERROR ${timestamp()}] ${message}`);
  }
}

// ── General info ─────────────────────────────────────────────
function info(message: string, detail?: unknown) {
  if (!ENABLED) return;
  const extra = detail !== undefined ? ` | ${truncate(detail)}` : '';
  console.log(`[INFO ${timestamp()}] ${message}${extra}`);
}

const Logger = { api, socket, auth, error, info };
export default Logger;
