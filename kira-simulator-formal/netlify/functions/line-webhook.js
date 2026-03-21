const crypto = require('crypto');
const { replyText, json } = require('./_line');

function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: 'ok' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const rawBody = event.body || '';
  const signature = event.headers['x-line-signature'] || event.headers['X-Line-Signature'];
  const secret = process.env.LINE_CHANNEL_SECRET || '';

  if (secret && signature && !verifySignature(rawBody, signature, secret)) {
    return json(401, { ok: false, reason: 'invalid signature' });
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch (e) {
    return json(400, { ok: false, reason: 'invalid json' });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0) return json(200, { ok: true, events: 0 });

  const replies = [];
  for (const ev of events) {
    const userId = ev?.source?.userId;
    const replyToken = ev?.replyToken;
    if (!userId || !replyToken) continue;
  
  }

  return json(200, { ok: true, replies });
};
