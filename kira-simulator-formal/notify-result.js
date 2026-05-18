const { pushText, json } = require('./_line');

const LABELS = {
  concrete: '土間コンクリート',
  gravel: '砕石敷き',
  weed_gravel: '防草シート＋砕石敷き',
  turf: '人工芝',
  fence_mesh: 'メッシュフェンス',
  privacy_fence: '目隠しフェンス',
  block_add: 'ブロック1段追加',
  block_new: 'ブロック新設（ベースから）',
  carport: 'カーポート',
  concrete_break: 'コンクリート解体',
  block_break_top: 'ブロック解体（上だけ）',
  block_break_base: 'ブロック解体（ベースごと）',
  fence_remove: 'フェンス撤去',
  custom_consult: '一覧にない工事も相談',
};

const PRESET_AREAS = {
  approach: 'アプローチ程度（約5㎡）',
  car1: '車1台分程度（約15㎡）',
  car2: '車2台分程度（約30㎡）',
  garden: '庭の一部（約20㎡）',
  large: '広めの駐車場・庭（約50㎡）',
};

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

function selectedItemsText(selected = [], results = {}) {
  const itemLabels = (results.items || []).map((item) => item.label);
  const consult = (results.consult || []).filter(Boolean);
  const fallback = selected.map((key) => LABELS[key] || key);
  const all = [...itemLabels, ...consult, ...fallback].filter(Boolean);
  return all.length ? Array.from(new Set(all)).join('、') : 'なし';
}

function areaInputText(val = {}) {
  if (val.mode === 'size') return `縦${val.length || '-'}m×横${val.width || '-'}m`;
  if (val.mode === 'preset') return PRESET_AREAS[val.preset] || '目安未選択';
  return `${val.quantity || '-'}㎡`;
}

function inputValuesText(selected = [], inputs = {}) {
  const parts = [];
  for (const key of selected) {
    const val = inputs[key] || {};
    if (['concrete','gravel','weed_gravel','turf','concrete_break'].includes(key)) {
      parts.push(`${LABELS[key] || key}: ${areaInputText(val)}`);
    } else if (key === 'fence_mesh') {
      const methodMap = { new: '通常新設', core: '既存ブロック上', block_add: 'ブロック1段追加' };
      parts.push(`メッシュフェンス: 設置方法=${methodMap[val.method] || '-'} / 長さ=${val.length || '-'}m`);
    } else if (key === 'carport') {
      parts.push(`カーポート: ${val.size || '-'}台用`);
    } else if (key === 'custom_consult') {
      parts.push(`相談=${val.note || '-'}`);
    } else if (typeof val.quantity !== 'undefined') {
      parts.push(`${LABELS[key] || key}: ${val.quantity || '-'}${['privacy_fence','block_add','block_new','block_break_top','block_break_base','fence_remove'].includes(key) ? 'm' : ''}`);
    }
  }
  return parts.length ? parts.join(' / ') : 'なし';
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
  const inputs = body.inputs || {};
  const estimatedPrice = `${yen(results.totalLow)}〜${yen(results.totalHigh)}`;

  const text = [
    '概算シミュレーター結果が表示されました',
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    `・項目: ${selectedItemsText(selected, results)}`,
    `・条件: ${inputValuesText(selected, inputs)}`,
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
