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

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value || 0);
}

function selectedItemsText(selected = [], inputs = {}, results = {}) {
  const itemLabels = (results.items || []).map((item) => item.label);
  const consult = (results.consult || []).filter(Boolean);
  const fallback = selected.map((key) => LABELS[key] || key);
  const all = [...itemLabels, ...consult, ...fallback].filter(Boolean);
  return all.length ? Array.from(new Set(all)).join('、') : 'なし';
}

function inputValuesText(selected = [], inputs = {}) {
  const parts = [];
  for (const key of selected) {
    const val = inputs[key] || {};
    if (key === 'fence_mesh') {
      const methodMap = { new: '通常新設', core: '既存ブロック上', block_add: 'ブロック1段追加' };
      parts.push(`メッシュフェンス: 設置方法=${methodMap[val.method] || '-'} / 長さ=${val.length || '-'}m`);
    } else if (key === 'carport') {
      parts.push(`カーポート: ${val.size || '-'}台用`);
    } else if (key === 'custom_consult') {
      parts.push(`相談=${val.note || '-'}`);
    } else if (typeof val.quantity !== 'undefined') {
      parts.push(`${LABELS[key] || key}: ${val.quantity || '-'} `);
    }
  }
  return parts.length ? parts.join(' / ') : 'なし';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) {
    return json(400, { ok: false, reason: 'LINE_TARGET_USER_ID is not set' });
  }

  const body = JSON.parse(event.body || '{}');
  const results = body.results || { items: [], consult: [], totalLow: 0, totalHigh: 0 };
  const time = body.displayedAt || new Date().toISOString();
  const sessionId = body.sessionId || '-';
  const selected = body.selected || [];
  const inputs = body.inputs || {};
  const estimatedPrice = `${yen(results.totalLow)}〜${yen(results.totalHigh)}`;

  const text = [
    '概算シミュレーター結果が表示されました',
    `• 項目: ${selectedItemsText(selected, inputs, results)}`,
    `• 条件: ${inputValuesText(selected, inputs)}`,
    `• 概算: ${estimatedPrice}`,
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
