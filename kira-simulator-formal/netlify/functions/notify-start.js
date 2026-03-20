exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body || '{}');
  const message = [
    '【概算シミュレーター開始】',
    `開始日時: ${body.startedAt || '-'}`,
    `UA: ${body.userAgent || '-'}`,
  ].join('\n');

  const webhookUrl = process.env.LINE_WEBHOOK_URL;
  if (!webhookUrl) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'LINE_WEBHOOK_URL is not set', preview: message }) };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });

  return { statusCode: 200, body: JSON.stringify({ ok: response.ok }) };
};
