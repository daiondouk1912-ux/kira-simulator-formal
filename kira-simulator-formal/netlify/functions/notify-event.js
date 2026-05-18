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

function resultPrice(results = {}) {
  const low = results.totalLow || 0;
  const high = results.totalHigh || 0;
  if (!low && !high) return '-';
  return `${yen(low)}〜${yen(high)}`;
}

function eventTitle(eventType) {
  if (eventType === 'selection_complete') return '工事項目が選択されました';
  if (eventType === 'input_complete') return '内容入力が完了しました';
  if (eventType === 'consult_clicked') return '相談ボタンが押されました';
  return '概算シミュレーターの操作がありました';
}

function extraLines(body) {
  const eventType = body.eventType;
  const lines = [];
  const selected = compactList(body.selectedLabels || []);
  const inputSummary = compactList(body.inputSummary || []);
  const results = body.results || {};

  if (eventType === 'selection_complete') {
    lines.push(`・選択項目: ${selected}`);
  } else if (eventType === 'input_complete') {
    lines.push(`・項目: ${selected}`);
    lines.push(`・入力内容: ${inputSummary}`);
    const custom = body.inputs?.custom_consult?.note;
    if (custom) lines.push(`・その他入力: ${custom}`);
  } else if (eventType === 'consult_clicked') {
    lines.push(`・項目: ${selected}`);
    lines.push(`・条件: ${inputSummary}`);
    lines.push(`・概算: ${resultPrice(results)}`);
  } else {
    lines.push(`・項目: ${selected}`);
  }

  return lines;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) return json(400, { ok: false, reason: 'LINE_TARGET_USER_ID is not set' });

  const body = JSON.parse(event.body || '{}');
  const text = [
    eventTitle(body.eventType),
    `・受付番号: ${body.receiptNo || '-'}`,
    `・エリア: ${body.projectArea || '未入力'}`,
    ...extraLines(body),
    `・時間: ${jstTime(body.eventAt || new Date().toISOString())}`,
  ].join('\n');

  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
