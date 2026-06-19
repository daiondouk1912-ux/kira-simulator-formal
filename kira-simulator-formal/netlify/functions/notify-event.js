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

function durationText(ms) {
  const totalSeconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  if (!totalSeconds) return '-';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}時間${minutes}分${seconds}秒`;
  if (minutes) return `${minutes}分${seconds}秒`;
  return `${seconds}秒`;
}

function inputItemCountText(value) {
  const count = Number(value || 0);
  return count > 0 ? `${count}項目` : '-';
}

function uniqueItems(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function compactList(values = []) {
  const items = uniqueItems(values);
  return items.length ? items.join('、') : 'なし';
}

function bulletList(values = [], maxItems = 8) {
  const items = uniqueItems(values);
  if (!items.length) return 'なし';
  const shown = items.slice(0, maxItems).map((item) => `・${item}`);
  if (items.length > maxItems) shown.push(`・ほか${items.length - maxItems}件`);
  return shown.join('\n');
}

function limitText(value, max = 900) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}…（省略）` : text;
}

function trimMessage(text, max = 4500) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max)}\n…長文のため一部省略しました` : value;
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
  if (eventType === 'consult_clicked') return '問い合わせ（質問）ボタンが押されました';
  if (eventType === 'feedback_submitted') return '概算シミュレーターの感想が届きました';
  if (eventType === 'line_save_clicked') return '概算結果のLINE保存ボタンが押されました';
  return '概算シミュレーターの操作がありました';
}

function extraLines(body) {
  const eventType = body.eventType;
  const lines = [];
  const selected = limitText(bulletList(body.selectedLabels || []));
  const inputSummary = limitText(bulletList(body.inputSummary || []));
  const results = body.results || {};

  if (eventType === 'selection_complete') {
    lines.push('・選択項目:\n' + selected);
  } else if (eventType === 'input_complete') {
    lines.push('・項目:\n' + selected);
    lines.push('・入力内容:\n' + inputSummary);
    const custom = body.inputs?.custom_consult?.note;
    if (custom) lines.push(`・その他入力: ${limitText(custom, 500)}`);
  } else if (eventType === 'consult_clicked') {
    lines.push('・項目:\n' + selected);
    lines.push('・入力内容:\n' + inputSummary);
    lines.push(`・概算: ${resultPrice(results)}`);
  } else if (eventType === 'feedback_submitted') {
    lines.push('・項目:\n' + selected);
    lines.push(`・概算: ${resultPrice(results)}`);
    lines.push(`・感想: ${limitText(body.feedbackText || '未入力', 1200)}`);
  } else if (eventType === 'line_save_clicked') {
    lines.push('・項目:\n' + selected);
    lines.push('・入力内容:\n' + inputSummary);
    lines.push(`・概算: ${resultPrice(results)}`);
  } else {
    lines.push('・項目:\n' + selected);
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
  const text = trimMessage([
    eventTitle(body.eventType),
    `・受付番号: ${body.receiptNo || '-'}`,
    `・エリア: ${body.projectArea || '未入力'}`,
    `・入力項目数: ${inputItemCountText(body.inputItemCount)}`,
    `・滞在時間: ${durationText(body.elapsedMs)}`,
    ...extraLines(body),
    `・時間: ${jstTime(body.eventAt || new Date().toISOString())}`,
  ].join('\n'));

  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
