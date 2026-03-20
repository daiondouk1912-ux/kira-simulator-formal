function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body || '{}');
  const results = body.results || { items: [], consult: [], totalLow: 0, totalHigh: 0 };
  const customer = body.inputs?.customer || {};

  const itemLines = results.items.length
    ? results.items.map((item) => `・${item.label}: ${yen(item.low)}〜${yen(item.high)}`).join('\n')
    : '・概算対象なし';

  const consultLines = results.consult?.length
    ? results.consult.map((item) => `・${item}`).join('\n')
    : '・なし';

  const message = [
    '【概算シミュレーター結果表示】',
    `開始日時: ${body.startedAt || '-'}`,
    `結果表示日時: ${body.displayedAt || '-'}`,
    '',
    '■ 工事項目別',
    itemLines,
    '',
    '■ 合計目安',
    `${yen(results.totalLow || 0)}〜${yen(results.totalHigh || 0)}`,
    '',
    '■ 相談項目',
    consultLines,
    '',
    '■ 連絡メモ',
    `お名前: ${customer.name || '-'}`,
    `電話番号: ${customer.phone || '-'}`,
    `LINE名: ${customer.lineName || '-'}`,
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
