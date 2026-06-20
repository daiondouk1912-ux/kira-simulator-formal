'use strict';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://kira-simulator-formal.netlify.app',
  'http://localhost:8888',
  'http://localhost:5173',
  'http://localhost:3000',
];

const MAX_BODY_BYTES = 30 * 1024;
const MAX_TEXT_LENGTH = 500;
const MAX_SHORT_TEXT_LENGTH = 120;
const duplicateMemory = new Map();

function getHeader(event, name) {
  const headers = event.headers || {};
  const lower = String(name).toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === lower) return value;
  }
  return '';
}

function jsonResponse(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}

function safeError(statusCode = 400, code = 'invalid_request') {
  return jsonResponse(statusCode, { ok: false, reason: code });
}

function getAllowedOrigins() {
  const env = process.env.KIRA_ALLOWED_ORIGINS || '';
  const fromEnv = env.split(',').map((v) => v.trim()).filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]);
}

function checkOrigin(event) {
  const origin = getHeader(event, 'origin');
  const secFetchSite = getHeader(event, 'sec-fetch-site');
  const strictMissingOrigin = process.env.KIRA_STRICT_ORIGIN === '1';
  const allowed = getAllowedOrigins();

  if (origin && !allowed.has(origin)) {
    return { ok: false, reason: 'origin_not_allowed' };
  }

  if (!origin && strictMissingOrigin) {
    return { ok: false, reason: 'origin_required' };
  }

  // Browser cross-site POSTs should not be accepted unless the Origin is explicitly allowed.
  if (secFetchSite === 'cross-site' && (!origin || !allowed.has(origin))) {
    return { ok: false, reason: 'cross_site_rejected' };
  }

  return { ok: true, origin: origin || '-' };
}

function assertPost(event) {
  if (event.httpMethod !== 'POST') return safeError(405, 'method_not_allowed');
  return null;
}

function parseJsonBody(event) {
  const raw = event.body || '';
  const size = Buffer.byteLength(raw, event.isBase64Encoded ? 'base64' : 'utf8');
  if (size > MAX_BODY_BYTES) {
    return { ok: false, response: safeError(413, 'payload_too_large') };
  }
  try {
    const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const body = JSON.parse(text || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { ok: false, response: safeError(400, 'invalid_json') };
    }
    return { ok: true, body };
  } catch (error) {
    return { ok: false, response: safeError(400, 'invalid_json') };
  }
}

function normalizeSpace(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripDangerousText(value, maxLength = MAX_TEXT_LENGTH) {
  let text = normalizeSpace(value);
  text = text
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*\/\s*script\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  if (text.length > maxLength) text = `${text.slice(0, maxLength)}…`;
  return text;
}

function safeShort(value, fallback = '-', maxLength = MAX_SHORT_TEXT_LENGTH) {
  const text = stripDangerousText(value, maxLength);
  return text || fallback;
}

function safeCode(value, fallback = '-') {
  const code = normalizeSpace(value).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60);
  return code || fallback;
}

function safeNumber(value, { min = 0, max = 99999999, fallback = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeInteger(value, { min = 0, max = 9999, fallback = 0 } = {}) {
  return Math.round(safeNumber(value, { min, max, fallback }));
}

function isMeaningfulText(value) {
  const text = stripDangerousText(value, MAX_TEXT_LENGTH);
  if (!text) return false;
  const noSymbols = text.replace(/[\p{P}\p{S}\s]/gu, '');
  return noSymbols.length >= 2;
}

function countUrls(value) {
  const text = String(value || '');
  const matches = text.match(/https?:\/\/|www\.|line\.me|t\.me|bit\.ly|tinyurl\.com/gi);
  return matches ? matches.length : 0;
}

function hasHoneypot(body) {
  const fields = ['website', 'url', 'company_url', 'hp_field', 'kira_hp_check'];
  return fields.some((field) => typeof body[field] === 'string' && body[field].trim() !== '');
}

function normalizeReceiptNo(value) {
  const raw = normalizeSpace(value);
  if (!raw) return '-';
  // Current app uses short 6-char receipt numbers. Keep this wider so future formats do not break.
  const clean = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  if (!clean || clean.length < 4) return '-';
  return clean;
}

function normalizeProjectArea(value) {
  const text = stripDangerousText(value, 80);
  if (!text) return '未入力';
  // Avoid exact addresses being pushed through accidentally.
  return text.replace(/\d{1,4}[-－]\d{1,4}([-－]\d{1,4})?/g, '番地省略');
}

function sanitizeDeep(value, depth = 0) {
  if (depth > 5) return '[省略]';
  if (value == null) return value;
  if (typeof value === 'string') return stripDangerousText(value, depth >= 3 ? 160 : MAX_TEXT_LENGTH);
  if (typeof value === 'number') return safeNumber(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitizeDeep(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value).slice(0, 60)) {
      const cleanKey = String(key).replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 50);
      if (!cleanKey) continue;
      out[cleanKey] = sanitizeDeep(val, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, 120);
}

function dedupe(key, ttlMs = 12000) {
  const now = Date.now();
  for (const [k, expiresAt] of duplicateMemory.entries()) {
    if (expiresAt <= now) duplicateMemory.delete(k);
  }
  const safeKey = String(key || '').slice(0, 300);
  if (!safeKey) return false;
  if (duplicateMemory.has(safeKey)) return true;
  duplicateMemory.set(safeKey, now + ttlMs);
  return false;
}

function safeLineText(lines) {
  return lines
    .filter((line) => typeof line !== 'undefined' && line !== null)
    .map((line) => stripDangerousText(line, 900))
    .join('\n')
    .slice(0, 4500);
}

function validateCommonRequest(event) {
  const methodError = assertPost(event);
  if (methodError) return { ok: false, response: methodError };

  const origin = checkOrigin(event);
  if (!origin.ok) return { ok: false, response: safeError(403, origin.reason) };

  const parsed = parseJsonBody(event);
  if (!parsed.ok) return { ok: false, response: parsed.response };

  if (hasHoneypot(parsed.body)) return { ok: false, response: safeError(400, 'bot_detected') };

  return { ok: true, body: parsed.body, origin: origin.origin };
}

function getEnvTargetUserId() {
  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) {
    console.error('[security] LINE_TARGET_USER_ID is not set');
    return '';
  }
  return to;
}

module.exports = {
  jsonResponse,
  safeError,
  validateCommonRequest,
  stripDangerousText,
  safeShort,
  safeCode,
  safeNumber,
  safeInteger,
  isMeaningfulText,
  countUrls,
  normalizeReceiptNo,
  normalizeProjectArea,
  sanitizeDeep,
  dedupe,
  safeLineText,
  getEnvTargetUserId,
};
