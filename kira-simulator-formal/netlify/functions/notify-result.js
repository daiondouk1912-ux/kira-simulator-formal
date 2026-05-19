const { pushText, json } = require('./_line');

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value || 0);
}

function jstTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return value || '-';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function compactList(values = []) {
  const items = values.filter(Boolean);
  return items.length ? Array.from(new Set(items)).join('、') : 'なし';
}

function selectedItemsText(selected = [], results = {}) {
  const itemLabels = (results.items || []).map((item) => item.label);
  const consult = (results.consult || []).filter(Boolean);
  return compactList([...itemLabels, ...consult]);
}

function inputValuesText(results = {}) {
  const items = results.items || [];
  const parts = items.map((item) => {
    const input = item.inputText || (item.quantity && item.unit ? `${item.quantity}${item.unit}` : '定額レンジ');
    return `${item.label}: ${input}`;
  });
  const consult = (results.consult || []).filter(Boolean).map((item) => `相談: ${item}`);
  return compactList([...parts, ...consult]);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) return json(400, { ok: false, reason: 'LINE_TARGET_USER_ID is not set' });

  const body = JSON.parse(event.body || '{}');
  const results = body.results || { items: [], consult: [], totalLow: 0, totalHigh: 0 };
  const time = jstTime(body.displayedAt || new Date().toISOString());
  const receiptNo = body.receiptNo || '-';
  const projectArea = body.projectArea || '未入力';
  const selected = body.selected || [];
  const estimatedPrice = `${yen(results.totalLow)}〜${yen(results.totalHigh)}`;

  const text = [
    '概算シミュレーター結果が表示されました',
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    `・項目: ${selectedItemsText(selected, results)}`,
    `・条件: ${inputValuesText(results)}`,
    `・概算: ${estimatedPrice}`,
    `・時間: ${time}`,
  ].join('\n');

  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
