'use strict';

const { pushText } = require('./_line');
const {
  jsonResponse,
  safeError,
  validateCommonRequest,
  stripDangerousText,
  safeShort,
  safeNumber,
  safeInteger,
  normalizeReceiptNo,
  normalizeProjectArea,
  sanitizeDeep,
  safeLineText,
  dedupe,
  getEnvTargetUserId,
} = require('./_security');

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
  tile_deck: 'タイルデッキ',
  approach: 'アプローチ・園路',
  stone_approach: 'タイル・石貼り系アプローチ',
  retaining_wall: '土留め・高低差調整',
  edging: '見切り材・境界処理',
  lighting: '照明・ライトアップ',
  drainage_adjust: '排水・桝まわり調整',
  gate_post: '門柱・ポストまわり',
  custom_consult: 'その他の工事・気になる内容',
};

const PRESET_AREAS = {
  approach: 'アプローチ程度（約5㎡）',
  car1: '車1台分程度（約15㎡）',
  car2: '車2台分程度（約30㎡）',
  garden: '庭の一部（約20㎡）',
  large: '広めの駐車場・庭（約50㎡）',
};

const PRIVACY_FENCE_HEIGHTS = {
  h1000: 'H800〜H1000程度',
  h1200: 'H1200程度',
  h1600: 'H1600程度',
  h1800: 'H1800程度',
  h1800plus: 'H1800超・高めの目隠し',
};

const PRIVACY_FENCE_METHODS = {
  block_existing: '既存ブロック上に取り付け',
  block_new: 'ブロック追加・新設して取り付け',
  independent: '独立基礎で柱を建てる',
  unknown: 'まだ分からない',
};

function privacyFenceInputText(val = {}) {
  const length = safeShort(val.length || val.quantity || '-');
  const height = PRIVACY_FENCE_HEIGHTS[val.height] || PRIVACY_FENCE_HEIGHTS.h1200;
  const method = ['h1600', 'h1800', 'h1800plus'].includes(val.height)
    ? `${PRIVACY_FENCE_METHODS.independent}（H1200超のため）`
    : (PRIVACY_FENCE_METHODS[val.method] || PRIVACY_FENCE_METHODS.block_existing);
  return `目隠しフェンス: 長さ=${length}m / 高さ=${height} / 取付方法=${method}`;
}


function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(safeNumber(value));
}

function jstTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function sanitizeResults(results = {}) {
  const rawItems = Array.isArray(results.items) ? results.items : [];
  const items = rawItems.slice(0, 20).map((item) => ({
    label: safeShort(item.label || item.name || '工事項目', '工事項目', 80),
    low: safeNumber(item.low, { max: 99999999 }),
    high: safeNumber(item.high, { max: 99999999 }),
    quantity: safeNumber(item.quantity, { max: 99999, fallback: 0 }),
    unit: safeShort(item.unit || '', '', 10),
    inputText: safeShort(item.inputText || '', '', 180),
  }));
  const consult = (Array.isArray(results.consult) ? results.consult : [])
    .slice(0, 10)
    .map((v) => stripDangerousText(v, 180))
    .filter(Boolean);
  const itemLow = items.reduce((sum, item) => sum + item.low, 0);
  const itemHigh = items.reduce((sum, item) => sum + item.high, 0);
  const totalLow = safeNumber(results.totalLow, { max: 99999999, fallback: itemLow });
  const totalHigh = safeNumber(results.totalHigh, { max: 99999999, fallback: itemHigh });
  return { items, consult, totalLow, totalHigh };
}

function selectedItemsText(selected = [], results = {}) {
  const itemLabels = (results.items || []).map((item) => item.label);
  const consult = (results.consult || []).filter(Boolean);
  const fallback = (Array.isArray(selected) ? selected : [])
    .slice(0, 30)
    .map((key) => LABELS[key] || safeShort(key, '', 40));
  const all = [...itemLabels, ...consult, ...fallback].filter(Boolean);
  return all.length ? Array.from(new Set(all)).join('、').slice(0, 900) : 'なし';
}

function areaInputText(val = {}) {
  if (val.mode === 'size') return `縦${safeShort(val.length)}m×横${safeShort(val.width)}m`;
  if (val.mode === 'preset') return PRESET_AREAS[val.preset] || '目安未選択';
  return `${safeShort(val.quantity)}㎡`;
}

function inputValuesText(selected = [], inputs = {}) {
  const parts = [];
  for (const key of (Array.isArray(selected) ? selected : []).slice(0, 30)) {
    const val = inputs && typeof inputs === 'object' ? (inputs[key] || {}) : {};
    if (['concrete','gravel','weed_gravel','turf','concrete_break','tile_deck','approach','stone_approach'].includes(key)) {
      parts.push(`${LABELS[key] || key}: ${areaInputText(val)}`);
    } else if (key === 'fence_mesh') {
      const methodMap = { new: '通常新設', core: '既存ブロック上', block_add: 'ブロック1段追加' };
      parts.push(`メッシュフェンス: 設置方法=${methodMap[val.method] || '-'} / 長さ=${safeShort(val.length)}m`);
    } else if (key === 'privacy_fence') {
      parts.push(privacyFenceInputText(val));
    } else if (key === 'carport') {
      parts.push(`カーポート: ${safeShort(val.size)}台用`);
    } else if (key === 'custom_consult') {
      parts.push(`相談=${stripDangerousText(val.note || '-', 180)}`);
    } else if (typeof val.quantity !== 'undefined') {
      const suffix = ['privacy_fence','block_add','block_new','block_break_top','block_break_base','fence_remove'].includes(key) ? 'm' : '';
      parts.push(`${LABELS[key] || safeShort(key)}: ${safeShort(val.quantity)}${suffix}`);
    }
  }
  return parts.length ? parts.join(' / ').slice(0, 1600) : 'なし';
}

exports.handler = async (event) => {
  const checked = validateCommonRequest(event);
  if (!checked.ok) return checked.response;

  const to = getEnvTargetUserId();
  if (!to) return safeError(500, 'notify_unavailable');

  const body = checked.body;
  const receiptNo = normalizeReceiptNo(body.receiptNo);
  const projectArea = normalizeProjectArea(body.projectArea);
  const selected = Array.isArray(body.selected) ? body.selected.map((v) => safeShort(v, '', 40)).filter(Boolean) : [];
  const inputs = sanitizeDeep(body.inputs || {});
  const results = sanitizeResults(body.results || {});
  const time = jstTime(body.displayedAt || new Date().toISOString());
  const inputCount = safeInteger(body.inputCount || body.inputItemCount || body.enteredCount, { max: 80, fallback: 0 });
  const durationSec = safeInteger(body.durationSec || body.staySeconds || body.elapsedSeconds, { max: 21600, fallback: 0 });

  if (!selected.length && results.items.length === 0 && results.consult.length === 0) {
    return safeError(400, 'empty_result');
  }

  const estimatedPrice = `${yen(results.totalLow)}〜${yen(results.totalHigh)}`;
  const duplicateKey = `result:${receiptNo}:${estimatedPrice}:${selected.join(',')}`;
  if (dedupe(duplicateKey, 15000)) {
    return jsonResponse(200, { ok: true, deduped: true });
  }

  const text = safeLineText([
    '概算シミュレーター結果が表示されました',
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    `・項目: ${selectedItemsText(selected, results)}`,
    `・条件: ${inputValuesText(selected, inputs)}`,
    `・概算: ${estimatedPrice}`,
    inputCount ? `・入力項目数: ${inputCount}` : null,
    durationSec ? `・滞在時間: ${durationSec}秒` : null,
    `・時間: ${time}`,
  ]);

  try {
    await pushText(to, text);
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('[notify-result] push failed', { statusCode: error.statusCode, message: error.message });
    return safeError(500, 'notify_failed');
  }
};
