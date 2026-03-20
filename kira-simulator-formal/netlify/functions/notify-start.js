const { pushText, json } = require('./_line');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) {
    return json(400, { ok: false, reason: 'LINE_TARGET_USER_ID is not set' });
  }

  const body = JSON.parse(event.body || '{}');
  const time = body.startedAt || new Date().toISOString();
  const sessionId = body.sessionId || '-';
  const text = [
    '概算シミュレーターが開始されました',
    `• 時間: ${time}`,
    `• セッションID: ${sessionId}`,
  ].join('\n');

  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
