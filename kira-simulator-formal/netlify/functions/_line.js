const LINE_API_BASE = 'https://api.line.me/v2/bot/message';

function getAccessToken() {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
}

function authHeaders() {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function lineFetch(path, payload) {
  const token = getAccessToken();
  if (!token) {
    const error = new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    error.statusCode = 500;
    throw error;
  }

  const res = await fetch(`${LINE_API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    const error = new Error(text || 'LINE API request failed');
    error.statusCode = res.status;
    throw error;
  }
  return text;
}

async function pushText(to, text) {
  return lineFetch('/push', {
    to,
    messages: [{ type: 'text', text }],
  });
}

async function replyText(replyToken, text) {
  return lineFetch('/reply', {
    replyToken,
    messages: [{ type: 'text', text }],
  });
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  };
}

module.exports = { pushText, replyText, json };
