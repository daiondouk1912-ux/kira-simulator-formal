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

function bulletList(values = [], maxItems = 10) {
  const items = uniqueItems(values);
  if (!items.length) return 'なし';
  const shown = items.slice(0, maxItems).map((item) => `・${item}`);
  if (items.length > maxItems) shown.push(`・ほか${items.length - maxItems}件`);
  return shown.join('\n');
}

function limitText(value, max = 1000) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}…（省略）` : text;
}

function trimMessage(text, max = 4500) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max)}\n…長文のため一部省略しました` : value;
}

function selectedItemsText(selected = [], results = {}) {
  const itemLabels = (results.items || []).map((item) => item.label);
  const consult = (results.consult || []).filter(Boolean);
  return bulletList([...itemLabels, ...consult]);
}

function inputValuesText(results = {}) {
  const items = results.items || [];
  const parts = items.map((item) => {
    const input = item.inputText || (item.quantity && item.unit ? `${item.quantity}${item.unit}` : '定額レンジ');
    return `${item.label}: ${input}`;
  });
  const consult = (results.consult || []).filter(Boolean).map((item) => `相談: ${item}`);
  return bulletList([...parts, ...consult]);
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
  const inputItemCount = body.inputItemCount || selected.length || 0;
  const elapsedMs = body.elapsedMs || 0;

  const text = trimMessage([
    '概算シミュレーター結果が表示されました',
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    `・入力項目数: ${inputItemCountText(inputItemCount)}`,
    `・滞在時間: ${durationText(elapsedMs)}`,
    `・項目:\n${limitText(selectedItemsText(selected, results))}`,
    `・入力内容:\n${limitText(inputValuesText(results))}`,
    `・概算: ${estimatedPrice}`,
    `・時間: ${time}`,
  ].join('\n'));

  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
