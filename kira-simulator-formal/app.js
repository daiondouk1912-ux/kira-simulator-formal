// v13.2: 人工芝文言調整 + 感想欄追加
// 計算に使う公開用レンジは publicPriceMaster.js から読み込みます。
// 原価・人工原価・利益率などの内部情報は、このお客さま用アプリには入れません。
const {
  PRICE_MASTER,
  WORK_OPTIONS,
  AREA_KEYS,
  QUANTITY_KEYS,
  PRESET_AREAS,
  PRESET_AREAS_BY_WORK,
  V12_LABELS,
  RETAINING_TYPES,
  RETAINING_HEIGHTS,
  DRAINAGE_TYPES,
  GATE_POST_TYPES,
} = window.KIRA_PUBLIC_PRICE_MASTER;

function makeQuantityInput() {
  return { mode: 'direct', quantity: '', length: '', width: '', preset: '' };
}

const state = {
  step: 0,
  startedAt: null,
  sessionId: '',
  receiptNo: '',
  sessionCreatedAt: null,
  sessionMessage: '',
  validationMessage: '',
  startedNotified: false,
  resultNotified: false,
  startNotifyPending: false,
  resultNotifyPending: false,
  eventNotifyPending: false,
  selectionNotified: false,
  inputNotified: false,
  consultNotified: false,
  feedbackNotified: false,
  feedbackText: '',
  feedbackMessage: '',
  selected: [],
  projectArea: '',
  inputs: {
    concrete: makeQuantityInput(),
    gravel: makeQuantityInput(),
    weed_gravel: makeQuantityInput(),
    turf: makeQuantityInput(),
    fence_mesh: { type: 'mesh', method: 'new', length: '' },
    privacy_fence: { quantity: '' },
    block_add: { quantity: '' },
    block_new: { quantity: '' },
    carport: { size: '1' },
    concrete_break: makeQuantityInput(),
    block_break_top: { quantity: '' },
    block_break_base: { quantity: '' },
    fence_remove: { quantity: '' },
    tile_deck: makeQuantityInput(),
    approach: makeQuantityInput(),
    stone_approach: makeQuantityInput(),
    retaining_wall: { type: 'low_block', length: '', height: 'normal' },
    edging: { length: '' },
    lighting: { count: '1' },
    drainage_adjust: { type: 'height' },
    gate_post: { type: 'simple' },
    custom_consult: { note: '' },
  },
};

const app = document.getElementById('app');
const STEP_LABELS = ['スタート', '工事を選ぶ', '内容を入力', '内容を確認', '概算を見る'];
const LINE_TALK_URL = 'https://line.me/R/oaMessage/%40963rsnpu';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const APP_VERSION = 'v13.3-large-area-price-adjust';

function fnUrl(name) {
  return `${window.location.origin}/.netlify/functions/${name}`;
}

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}
function formatRange(low, high) { return `${yen(low)} 〜 ${yen(high)}`; }
function getBracket(def, q) { return def.brackets.find((b) => q <= b.max) || def.brackets[def.brackets.length - 1]; }
function sanitizeText(value) { return String(value || '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#039;' }[c])); }

function getPresetAreasForKey(key) {
  return (PRESET_AREAS_BY_WORK && PRESET_AREAS_BY_WORK[key]) ? PRESET_AREAS_BY_WORK[key] : PRESET_AREAS;
}

function getPresetForKey(key, presetKey) {
  return getPresetAreasForKey(key)[presetKey];
}

function generateReceiptNo() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function resetNotifyFlags() {
  state.startedNotified = false;
  state.resultNotified = false;
  state.selectionNotified = false;
  state.inputNotified = false;
  state.consultNotified = false;
  state.feedbackNotified = false;
  state.feedbackText = '';
  state.feedbackMessage = '';
  state.startNotifyPending = false;
  state.resultNotifyPending = false;
  state.eventNotifyPending = false;
}

function startNewSession(showMessage = false) {
  state.startedAt = new Date().toISOString();
  state.sessionId = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  state.receiptNo = generateReceiptNo();
  state.sessionCreatedAt = Date.now();
  resetNotifyFlags();
  if (showMessage) {
    state.sessionMessage = `一定時間が経過したため、新しい受付番号（${state.receiptNo}）で再開します。`;
  }
}

function isSessionExpired() {
  return !!state.sessionCreatedAt && (Date.now() - state.sessionCreatedAt > SESSION_TIMEOUT_MS);
}

function ensureSession() {
  if (!state.sessionId || !state.receiptNo || !state.sessionCreatedAt) startNewSession(false);
  else if (isSessionExpired()) startNewSession(true);
  return { sessionId: state.sessionId, receiptNo: state.receiptNo };
}

function getProjectArea() {
  const area = String(state.projectArea || '').trim();
  return area || '未入力';
}

function getQuantityValue(key) {
  const value = state.inputs[key];
  if (!value) return 0;
  if (!AREA_KEYS.has(key)) return Number(value.quantity || 0);
  if (value.mode === 'size') return Number(value.length || 0) * Number(value.width || 0);
  if (value.mode === 'preset') return getPresetForKey(key, value.preset)?.value || 0;
  return Number(value.quantity || 0);
}

function quantityInputLabel(key) {
  const value = state.inputs[key];
  if (!value) return '-';
  if (AREA_KEYS.has(key)) {
    const q = getQuantityValue(key);
    if (value.mode === 'size') {
      const length = value.length || '-';
      const width = value.width || '-';
      return `縦${length}m × 横${width}m（約${q ? round1(q) : '-'}㎡）`;
    }
    if (value.mode === 'preset') {
      return `${getPresetForKey(key, value.preset)?.label || '未選択'}（約${q || '-'}㎡）`;
    }
    return `${value.quantity || '-'}㎡`;
  }
  return `${value.quantity || '-'}${PRICE_MASTER[key]?.unit || ''}`;
}

function round1(value) {
  const n = Math.round(Number(value || 0) * 10) / 10;
  return Number.isInteger(n) ? String(n) : String(n);
}

function calcFromMaster(key, quantity) {
  const def = PRICE_MASTER[key];
  if (!def || !quantity || quantity <= 0) return null;
  if (def.fixed) return { label: def.label, low: def.fixed.low, high: def.fixed.high, quantity: null, unit: null, rule: 'fixed' };
  const bracket = getBracket(def, quantity);
  let low = quantity * bracket.low;
  let high = quantity * bracket.high;
  let minimumApplied = false;
  if (def.minimum) {
    if (low < def.minimum.low) { low = def.minimum.low; minimumApplied = true; }
    if (high < def.minimum.high) { high = def.minimum.high; minimumApplied = true; }
  }
  return {
    label: def.label,
    low,
    high,
    quantity,
    unit: def.unit,
    rule: minimumApplied ? 'minimum' : 'unit',
    inputText: quantityInputLabel(key),
  };
}

function calcMeshFence({ type, method, length }) {
  const q = Number(length);
  if (!q || q <= 0) return null;
  let variant = '通常新設';
  let low = 9000;
  let high = 11000;
  let minimum = { low: 90000, high: 130000 };

  if (type === 'mesh' && method === 'core') {
    variant = '既存ブロック上・コア抜きあり';
    low = 12000; high = 14500; minimum = { low: 180000, high: 250000 };
  } else if (type === 'mesh' && method === 'block_add') {
    variant = 'ブロック1段追加';
    low = 14000; high = 17000; minimum = { low: 220000, high: 300000 };
  } else if (type !== 'mesh') {
    return null;
  }

  let totalLow = q * low;
  let totalHigh = q * high;
  const minimumApplied = totalLow < minimum.low || totalHigh < minimum.high;
  totalLow = Math.max(totalLow, minimum.low);
  totalHigh = Math.max(totalHigh, minimum.high);

  return {
    label: `メッシュフェンス（${variant}）`,
    low: totalLow,
    high: totalHigh,
    quantity: q,
    unit: 'm',
    rule: minimumApplied ? 'minimum' : 'unit',
    inputText: `長さ：${length || '-'}m / 設置方法：${variant}`,
    meta: { type, method, variant },
  };
}


function v12AreaBandResult(key, q) {
  if (!q || q <= 0) return null;
  const label = V12_LABELS[key];
  let low = 0;
  let high = 0;
  let rule = 'unit';
  let note = '';
  if (key === 'tile_deck') {
    if (q <= 3) { low = 150000; high = 250000; rule = 'small_adjust'; }
    else if (q <= 8) { low = 250000; high = 450000; rule = 'band'; }
    else { low = q * 35000; high = q * 60000; }
    note = '下地・段差・タイル種類により金額が変わります。';
  } else if (key === 'approach') {
    if (q <= 3) { low = 80000; high = 150000; rule = 'small_adjust'; }
    else if (q <= 10) { low = 120000; high = 300000; rule = 'band'; }
    else { low = q * 12000; high = q * 30000; }
    note = '仕上げ・下地・勾配により金額が変わります。';
  } else if (key === 'stone_approach') {
    if (q <= 3) { low = 120000; high = 220000; rule = 'small_adjust'; }
    else if (q <= 10) { low = 200000; high = 450000; rule = 'band'; }
    else { low = q * 25000; high = q * 45000; }
    note = '石種・タイル種類・カット量により金額が変わります。';
  }
  return { label, low, high, quantity: q, unit: '㎡', rule, inputText: quantityInputLabel(key), note };
}

function calcEdging(input = {}) {
  const q = Number(input.length || 0);
  if (!q || q <= 0) return null;
  let low, high, rule = 'unit';
  if (q <= 3) { low = 30000; high = 60000; rule = 'small_adjust'; }
  else if (q <= 10) { low = 50000; high = 100000; rule = 'band'; }
  else { low = q * 4000; high = q * 8000; }
  return { label: V12_LABELS.edging, low, high, quantity: q, unit: 'm', rule, inputText: `長さ：${input.length || '-'}m`, note: '他工事と同時なら調整できる場合があります。' };
}

function calcLighting(input = {}) {
  const q = Number(input.count || 0);
  if (!q || q <= 0) return null;
  let low, high, rule = 'band';
  if (q <= 1) { low = 40000; high = 90000; rule = 'small_adjust'; }
  else if (q <= 3) { low = 80000; high = 180000; }
  else { low = 150000; high = 300000; }
  return { label: V12_LABELS.lighting, low, high, quantity: q, unit: '箇所', rule, inputText: `${q}箇所`, note: '電源位置・配線距離・器具により金額が変わります。' };
}

function calcDrainage(input = {}) {
  const type = input.type || 'height';
  const ranges = {
    height: { low: 30000, high: 60000 },
    cutdown: { low: 60000, high: 150000 },
    route: { low: 150000, high: 300000 },
  };
  const range = ranges[type] || ranges.height;
  return { label: `${V12_LABELS.drainage_adjust}（${DRAINAGE_TYPES[type] || DRAINAGE_TYPES.height}）`, low: range.low, high: range.high, quantity: null, unit: null, rule: type === 'height' ? 'small_adjust' : 'band', inputText: DRAINAGE_TYPES[type] || DRAINAGE_TYPES.height, note: '桝の種類・配管状況により現地確認が必要です。' };
}

function calcGatePost(input = {}) {
  const type = input.type || 'simple';
  const ranges = {
    simple: { low: 150000, high: 350000 },
    custom: { low: 250000, high: 600000 },
    delivery: { low: 500000, high: 1000000 },
    full: { low: 800000, high: 1200000 },
  };
  const range = ranges[type] || ranges.simple;
  return { label: `${V12_LABELS.gate_post}（${GATE_POST_TYPES[type] || GATE_POST_TYPES.simple}）`, low: range.low, high: range.high, quantity: null, unit: null, rule: 'band', inputText: GATE_POST_TYPES[type] || GATE_POST_TYPES.simple, note: '商品・仕上げ・配線により金額が変わります。' };
}

function calcRetainingWall(input = {}) {
  const type = input.type || 'low_block';
  if (type === 'unknown') return null;
  if (type === 'cast_concrete') {
    return { label: RETAINING_TYPES.cast_concrete, low: 300000, high: 500000, quantity: null, unit: null, rule: 'consult', inputText: '現場打ちコンクリート土留め・擁壁', note: '現地確認後にご案内します。' };
  }
  const q = Number(input.length || 0);
  if (!q || q <= 0) return null;
  const h = RETAINING_HEIGHTS[input.height || 'normal'] || RETAINING_HEIGHTS.normal;
  let low, high, rule = 'unit';
  if (type === 'form_block') {
    if (q <= 2) { low = 120000; high = 220000; rule = 'small_adjust'; }
    else { low = q * 28000; high = q * 45000; }
  } else {
    if (q <= 2) { low = 80000; high = 160000; rule = 'small_adjust'; }
    else { low = q * 18000; high = q * 30000; }
  }
  low = Math.round(low * h.rate);
  high = Math.round(high * h.rate);
  return { label: `${V12_LABELS.retaining_wall}（${RETAINING_TYPES[type]}）`, low, high, quantity: q, unit: 'm', rule, inputText: `${RETAINING_TYPES[type]} / 長さ：${input.length || '-'}m / 高さ：${h.label}`, note: '高さや掘削状況により金額が変わります。' };
}

function computeResults() {
  const items = [];
  const consult = [];

  for (const key of state.selected) {
    if (QUANTITY_KEYS.includes(key)) {
      const result = calcFromMaster(key, getQuantityValue(key));
      if (result) items.push(result);
    }
    if (key === 'fence_mesh') {
      const result = calcMeshFence(state.inputs.fence_mesh);
      if (result) items.push(result);
    }
    if (key === 'carport') {
      const size = state.inputs.carport.size;
      if (size === '1') items.push({ ...calcFromMaster('carport1', 1), label: 'カーポート1台用', inputText: '1台用' });
      else if (size === '2') items.push({ ...calcFromMaster('carport2', 1), label: 'カーポート2台用', inputText: '2台用' });
      else consult.push('カーポート3台用');
    }
    if (['tile_deck','approach','stone_approach'].includes(key)) {
      const result = v12AreaBandResult(key, getQuantityValue(key));
      if (result) items.push(result);
    }
    if (key === 'retaining_wall') {
      const result = calcRetainingWall(state.inputs.retaining_wall);
      if (result) items.push(result);
      else consult.push('土留め・高低差調整');
    }
    if (key === 'edging') {
      const result = calcEdging(state.inputs.edging);
      if (result) items.push(result);
    }
    if (key === 'lighting') {
      const result = calcLighting(state.inputs.lighting);
      if (result) items.push(result);
    }
    if (key === 'drainage_adjust') {
      const result = calcDrainage(state.inputs.drainage_adjust);
      if (result) items.push(result);
    }
    if (key === 'gate_post') {
      const result = calcGatePost(state.inputs.gate_post);
      if (result) items.push(result);
    }
    if (key === 'custom_consult') {
      consult.push(state.inputs.custom_consult.note?.trim() || '一覧にない工事の相談');
    }
  }

  const totalLow = items.reduce((sum, item) => sum + item.low, 0);
  const totalHigh = items.reduce((sum, item) => sum + item.high, 0);

  return { items, consult, totalLow, totalHigh };
}

function createStep(index, title) {
  const node = document.getElementById('step-template').content.firstElementChild.cloneNode(true);
  node.querySelector('.step-index').textContent = index + 1;
  node.querySelector('.step-title').textContent = title;
  return node;
}

function setBody(stepEl, html) { stepEl.querySelector('.step-body').innerHTML = html; }
function setActions(stepEl, buttons) {
  const area = stepEl.querySelector('.step-actions');
  area.innerHTML = '';
  buttons.forEach((btn) => {
    const el = document.createElement('button');
    el.textContent = btn.label;
    el.className = btn.className;
    el.disabled = !!btn.disabled;
    el.addEventListener('click', btn.onClick);
    area.appendChild(el);
  });
}

function progressPills(activeIndex) {
  return `<div class="progress-pills">${STEP_LABELS.map((label, index) => {
    const cls = index === activeIndex ? 'active' : index < activeIndex ? 'done' : '';
    return `<span class="pill ${cls}">${index + 1}. ${label}</span>`;
  }).join('')}</div>`;
}

async function notifyStart() {
  if (state.startedNotified || state.startNotifyPending) return;
  state.startNotifyPending = true;
  state.startedAt = state.startedAt || new Date().toISOString();
  ensureSession();
  try {
    const response = await fetch(fnUrl('notify-start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startedAt: state.startedAt,
        sessionId: state.sessionId,
        receiptNo: state.receiptNo,
        projectArea: getProjectArea(),
        userAgent: navigator.userAgent,
        appVersion: APP_VERSION,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) state.startedNotified = true;
  } catch (error) {
    console.warn('start notify failed', error);
  } finally {
    state.startNotifyPending = false;
  }
}

async function notifyResult(payload) {
  if (state.resultNotified || state.resultNotifyPending) return;
  state.resultNotifyPending = true;
  try {
    const response = await fetch(fnUrl('notify-result'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, appVersion: APP_VERSION }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) state.resultNotified = true;
  } catch (error) {
    console.warn('result notify failed', error);
  } finally {
    state.resultNotifyPending = false;
  }
}

function selectedLabels() {
  return state.selected.map((key) => WORK_OPTIONS.find((item) => item.id === key)?.label || key);
}

function currentInputSummary() {
  const parts = [];
  for (const key of state.selected) {
    if (QUANTITY_KEYS.includes(key)) {
      const meta = PRICE_MASTER[key];
      parts.push(`${meta.label}: ${quantityInputLabel(key)}`);
    } else if (key === 'fence_mesh') {
      const v = state.inputs.fence_mesh;
      const methodMap = { new: '通常新設', core: '既存ブロック上・コア抜き', block_add: 'ブロック1段追加' };
      parts.push(`メッシュフェンス: ${methodMap[v.method] || '-'} / 長さ${v.length || '-'}m`);
    } else if (key === 'carport') {
      parts.push(`カーポート: ${state.inputs.carport.size || '-'}台用`);
    } else if (['tile_deck','approach','stone_approach'].includes(key)) {
      parts.push(`${V12_LABELS[key]}: ${quantityInputLabel(key)}`);
    } else if (key === 'retaining_wall') {
      const v = state.inputs.retaining_wall;
      const h = RETAINING_HEIGHTS[v.height || 'normal']?.label || '-';
      parts.push(`土留め: ${RETAINING_TYPES[v.type] || '-'} / 長さ${v.length || '-'}m / 高さ${h}`);
    } else if (key === 'edging') {
      parts.push(`見切り材: 長さ${state.inputs.edging.length || '-'}m`);
    } else if (key === 'lighting') {
      parts.push(`照明: ${state.inputs.lighting.count || '-'}箇所`);
    } else if (key === 'drainage_adjust') {
      parts.push(`排水・桝: ${DRAINAGE_TYPES[state.inputs.drainage_adjust.type] || '-'}`);
    } else if (key === 'gate_post') {
      parts.push(`門柱: ${GATE_POST_TYPES[state.inputs.gate_post.type] || '-'}`);
    } else if (key === 'custom_consult') {
      parts.push(`その他: ${state.inputs.custom_consult.note || '未入力'}`);
    }
  }
  return parts;
}

function buildEventPayload(eventType) {
  ensureSession();
  const results = computeResults();
  return {
    eventType,
    eventAt: new Date().toISOString(),
    sessionId: state.sessionId,
    receiptNo: state.receiptNo,
    projectArea: getProjectArea(),
    selected: state.selected,
    selectedLabels: selectedLabels(),
    inputSummary: currentInputSummary(),
    inputs: state.inputs,
    results,
    feedbackText: state.feedbackText,
  };
}

async function notifyEvent(eventType) {
  if (state.eventNotifyPending) return false;
  const notifiedKeyMap = {
    selection_complete: 'selectionNotified',
    input_complete: 'inputNotified',
    consult_clicked: 'consultNotified',
    feedback_submitted: 'feedbackNotified',
  };
  const key = notifiedKeyMap[eventType];
  if (key && state[key]) return false;

  state.eventNotifyPending = true;
  try {
    const response = await fetch(fnUrl('notify-event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...buildEventPayload(eventType), appVersion: APP_VERSION }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok && key) { state[key] = true; return true; }
    return false;
  } catch (error) {
    console.warn('event notify failed', error);
    return false;
  } finally {
    state.eventNotifyPending = false;
  }
}


function buildResultPayload() {
  const results = computeResults();
  ensureSession();
  return {
    displayedAt: new Date().toISOString(),
    sessionId: state.sessionId,
    receiptNo: state.receiptNo,
    projectArea: getProjectArea(),
    startedAt: state.startedAt,
    selected: state.selected,
    inputs: state.inputs,
    results,
  };
}


function validateSelectedInputs() {
  const messages = [];
  const hasPositive = (v) => Number(v || 0) > 0;

  for (const key of state.selected) {
    const label = WORK_OPTIONS.find((item) => item.id === key)?.label || key;
    const input = state.inputs[key];

    if (AREA_KEYS.has(key)) {
      if (!input) continue;
      if (input.mode === 'size') {
        if (!hasPositive(input.length) || !hasPositive(input.width)) {
          messages.push(`${label}：縦と横の両方を入力してください。分からない場合は「目安から選ぶ」をご利用ください。`);
        }
      } else if (input.mode === 'preset') {
        if (!input.preset || !getPresetForKey(key, input.preset)) {
          messages.push(`${label}：目安を選択してください。`);
        }
      } else if (!hasPositive(input.quantity)) {
        messages.push(`${label}：面積を入力してください。分からない場合は「縦×横」または「目安から選ぶ」をご利用ください。`);
      }
      continue;
    }

    if (QUANTITY_KEYS.includes(key)) {
      if (!hasPositive(input?.quantity)) messages.push(`${label}：数量を入力してください。`);
      continue;
    }

    if (key === 'fence_mesh' && !hasPositive(state.inputs.fence_mesh.length)) messages.push('メッシュフェンス：長さを入力してください。');
    if (key === 'retaining_wall') {
      const v = state.inputs.retaining_wall;
      if (['low_block', 'form_block'].includes(v.type) && !hasPositive(v.length)) messages.push('土留め・高低差調整：長さを入力してください。');
    }
    if (key === 'edging' && !hasPositive(state.inputs.edging.length)) messages.push('見切り材・境界処理：長さを入力してください。');
    if (key === 'custom_consult' && !String(state.inputs.custom_consult.note || '').trim()) messages.push('その他の工事・気になる内容：内容を入力してください。');
  }

  return messages;
}

async function goToConfirmStep() {
  const messages = validateSelectedInputs();
  if (messages.length) {
    state.validationMessage = messages.join('\n');
    render();
    return;
  }
  state.validationMessage = '';
  await notifyEvent('input_complete');
  state.step = 3;
  render();
}

function goToResultStep() {
  const messages = validateSelectedInputs();
  if (messages.length) {
    state.validationMessage = messages.join('\n');
    state.step = 2;
    render();
    return;
  }
  state.validationMessage = '';
  state.step = 4;
  render();
}

function renderStep0() {
  const step = createStep(0, 'スタート');
  setBody(step, `
    ${progressPills(0)}
    ${state.sessionMessage ? `<div class="session-notice">${sanitizeText(state.sessionMessage)}</div>` : ''}
    <div class="grid">
      <div class="notice">
        <p>駐車場のコンクリート、フェンス、人工芝、カーポートなど、気になる工事の概算目安をご確認いただけます。まずは工事を選んで進んでください。</p>
      </div>
      <div class="benefit-note intro-benefit">
        <strong>シミュレーター利用後のご相談特典</strong>
        <p>概算シミュレーターをご利用後にご相談いただいた方には、工事内容に応じて特典をご案内できる場合があります。</p>
      </div>
      <div class="area-start-box">
        <label for="project-area">施工予定地のエリア（任意）</label>
        <input id="project-area" type="text" value="${sanitizeText(state.projectArea)}" placeholder="例）いわき市中央台、平、内郷、小名浜、泉町など" />
        <p>番地までの入力は不要です。エリアが分かると、施工条件や対応地域を踏まえて確認しやすくなります。</p>
      </div>
      <div class="subnotice">
        <p>※ 表示金額は概算の目安です。現地状況や施工条件により変動します。正式なお見積もりは現地確認後にご案内いたします。</p>
      </div>
    </div>
  `);
  const areaInput = step.querySelector('#project-area');
  areaInput.addEventListener('input', (e) => { state.projectArea = e.target.value; });
  setActions(step, [
    { label: 'シミュレーターをはじめる', className: 'primary', onClick: () => { state.step = 1; render(); } },
  ]);
  return step;
}

function renderStep1() {
  const step = createStep(1, '工事を選ぶ');
  setBody(step, `
    ${progressPills(1)}
    <p class="muted">複数選択できます。一覧にない工事や迷う内容は、最後に相談内容としてまとめてお送りいただけます。</p>
    <div class="selection-grid">
      ${WORK_OPTIONS.map((item) => `
        <div class="selection-card">
          <label>
            <input type="checkbox" value="${item.id}" ${state.selected.includes(item.id) ? 'checked' : ''} />
            <span>
              <strong>${item.label}</strong>
              <span>${item.note}</span>
            </span>
          </label>
        </div>
      `).join('')}
    </div>
  `);
  step.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const { value, checked } = e.target;
      if (checked) state.selected = Array.from(new Set([...state.selected, value]));
      else state.selected = state.selected.filter((x) => x !== value);
      render();
    });
  });
  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 0; render(); } },
    { label: '次へ', className: 'primary', disabled: state.selected.length === 0, onClick: async () => { await notifyEvent('selection_complete'); state.step = 2; render(); } },
  ]);
  return step;
}

function fieldBlock(title, description, content) {
  return `
    <div class="field-block">
      <div class="field-title">
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
      ${content}
    </div>
  `;
}

function renderAreaInputBlock(key, meta) {
  const input = state.inputs[key];
  const q = getQuantityValue(key);
  return fieldBlock(meta.label, '面積が分かる方は㎡で、分からない方は縦×横や目安から入力できます。', `
    <div class="input-methods" data-method-group="${key}">
      <label><input type="radio" name="mode-${key}" data-key="${key}" data-name="mode" value="direct" ${input.mode === 'direct' ? 'checked' : ''} />㎡で入力</label>
      <label><input type="radio" name="mode-${key}" data-key="${key}" data-name="mode" value="size" ${input.mode === 'size' ? 'checked' : ''} />縦×横で入力</label>
      <label><input type="radio" name="mode-${key}" data-key="${key}" data-name="mode" value="preset" ${input.mode === 'preset' ? 'checked' : ''} />目安から選ぶ</label>
    </div>
    ${input.mode === 'size' ? `
      <div class="field-row two-cols">
        <div class="field">
          <label>縦（m）</label>
          <input type="number" min="0" step="0.1" data-key="${key}" data-name="length" value="${input.length}" placeholder="例）5" />
        </div>
        <div class="field">
          <label>横（m）</label>
          <input type="number" min="0" step="0.1" data-key="${key}" data-name="width" value="${input.width}" placeholder="例）4" />
        </div>
      </div>
    ` : ''}
    ${input.mode === 'preset' ? `
      <div class="field-row one-col">
        <div class="field">
          <label>目安</label>
          <select data-key="${key}" data-name="preset">
            <option value="" ${input.preset === '' ? 'selected' : ''}>選択してください</option>
            ${Object.entries(getPresetAreasForKey(key)).map(([presetKey, preset]) => `<option value="${presetKey}" ${input.preset === presetKey ? 'selected' : ''}>${preset.label}</option>`).join('')}
          </select>
        </div>
      </div>
    ` : ''}
    ${input.mode === 'direct' ? `
      <div class="field-row one-col">
        <div class="field">
          <label>面積（㎡）</label>
          <input type="number" min="0" step="0.1" data-key="${key}" data-name="quantity" value="${input.quantity}" placeholder="例）20" />
        </div>
      </div>
    ` : ''}
    <p class="calc-preview">概算に使う面積：<strong>${q ? `${round1(q)}㎡` : '未入力'}</strong></p>
  `);
}

function renderSimpleQuantityBlock(key, meta) {
  return fieldBlock(meta.label, `${meta.unit}数をご入力ください。数量をもとに概算目安を算出します。`, `
    <div class="field-row one-col">
      <div class="field">
        <label>${meta.unit}数</label>
        <input type="number" min="0" step="0.1" data-key="${key}" data-name="quantity" value="${state.inputs[key].quantity}" placeholder="例）12" />
      </div>
    </div>
  `);
}

function renderStep2() {
  const step = createStep(2, '内容を入力');
  const blocks = [];

  state.selected.forEach((key) => {
    if (QUANTITY_KEYS.includes(key)) {
      const meta = PRICE_MASTER[key];
      if (AREA_KEYS.has(key)) blocks.push(renderAreaInputBlock(key, meta));
      else blocks.push(renderSimpleQuantityBlock(key, meta));
    }
    if (key === 'fence_mesh') {
      blocks.push(fieldBlock('メッシュフェンス', '設置方法と長さをもとに概算目安を表示します。', `
        <div class="field-row">
          <div class="field">
            <label>種類</label>
            <select data-key="fence_mesh" data-name="type">
              <option value="mesh" ${state.inputs.fence_mesh.type === 'mesh' ? 'selected' : ''}>メッシュフェンス</option>
            </select>
          </div>
          <div class="field">
            <label>設置方法</label>
            <select data-key="fence_mesh" data-name="method">
              <option value="new" ${state.inputs.fence_mesh.method === 'new' ? 'selected' : ''}>通常新設</option>
              <option value="core" ${state.inputs.fence_mesh.method === 'core' ? 'selected' : ''}>既存ブロック上・コア抜き</option>
              <option value="block_add" ${state.inputs.fence_mesh.method === 'block_add' ? 'selected' : ''}>ブロック1段追加</option>
            </select>
          </div>
          <div class="field">
            <label>長さ（m）</label>
            <input type="number" min="0" step="0.1" data-key="fence_mesh" data-name="length" value="${state.inputs.fence_mesh.length}" placeholder="例）20" />
          </div>
        </div>
      `));
    }
    if (key === 'carport') {
      blocks.push(fieldBlock('カーポート', '台数に合わせて概算目安を切り替えます。', `
        <div class="field-row one-col">
          <div class="field">
            <label>台数</label>
            <select data-key="carport" data-name="size">
              <option value="1" ${state.inputs.carport.size === '1' ? 'selected' : ''}>1台用</option>
              <option value="2" ${state.inputs.carport.size === '2' ? 'selected' : ''}>2台用</option>
              <option value="3" ${state.inputs.carport.size === '3' ? 'selected' : ''}>3台用（相談）</option>
            </select>
          </div>
        </div>
      `));
    }
    if (['tile_deck','approach','stone_approach'].includes(key)) {
      blocks.push(renderAreaInputBlock(key, { label: V12_LABELS[key] }));
    }
    if (key === 'retaining_wall') {
      const v = state.inputs.retaining_wall;
      blocks.push(fieldBlock('土留め・高低差調整', '土留めの種類と長さを選んでください。分からない場合は相談扱いでも進められます。', `
        <div class="field-row">
          <div class="field">
            <label>種類</label>
            <select data-key="retaining_wall" data-name="type">
              ${Object.entries(RETAINING_TYPES).map(([value, label]) => `<option value="${value}" ${v.type === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>長さ（m）</label>
            <input type="number" min="0" step="0.1" data-key="retaining_wall" data-name="length" value="${v.length}" placeholder="例）5" />
          </div>
          <div class="field">
            <label>高さの目安</label>
            <select data-key="retaining_wall" data-name="height">
              ${Object.entries(RETAINING_HEIGHTS).map(([value, item]) => `<option value="${value}" ${v.height === value ? 'selected' : ''}>${item.label}</option>`).join('')}
            </select>
          </div>
        </div>
      `));
    }
    if (key === 'edging') {
      blocks.push(fieldBlock('見切り材・境界処理', '人工芝・砂利・植栽まわりなどの見切り長さを入力してください。', `
        <div class="field-row one-col"><div class="field"><label>長さ（m）</label><input type="number" min="0" step="0.1" data-key="edging" data-name="length" value="${state.inputs.edging.length}" placeholder="例）8" /></div></div>
      `));
    }
    if (key === 'lighting') {
      blocks.push(fieldBlock('照明・ライトアップ', '設置したい照明の箇所数を選んでください。', `
        <div class="field-row one-col"><div class="field"><label>箇所数</label><select data-key="lighting" data-name="count"><option value="1" ${state.inputs.lighting.count === '1' ? 'selected' : ''}>1箇所</option><option value="2" ${state.inputs.lighting.count === '2' ? 'selected' : ''}>2箇所</option><option value="3" ${state.inputs.lighting.count === '3' ? 'selected' : ''}>3箇所</option><option value="4" ${state.inputs.lighting.count === '4' ? 'selected' : ''}>4箇所以上</option></select></div></div>
      `));
    }
    if (key === 'drainage_adjust') {
      blocks.push(fieldBlock('排水・桝まわり調整', '近い内容を選んでください。配管状況により現地確認が必要です。', `
        <div class="field-row one-col"><div class="field"><label>内容</label><select data-key="drainage_adjust" data-name="type">${Object.entries(DRAINAGE_TYPES).map(([value, label]) => `<option value="${value}" ${state.inputs.drainage_adjust.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div>
      `));
    }
    if (key === 'gate_post') {
      blocks.push(fieldBlock('門柱・ポストまわり', '近い内容を選んでください。商品・仕上げ・配線により金額が変わります。', `
        <div class="field-row one-col"><div class="field"><label>内容</label><select data-key="gate_post" data-name="type">${Object.entries(GATE_POST_TYPES).map(([value, label]) => `<option value="${value}" ${state.inputs.gate_post.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div>
      `));
    }
    if (key === 'custom_consult') {
      blocks.push(fieldBlock('その他の工事・気になる内容', '一覧にない工事や、どれを選べばいいか分からない内容があればご入力ください。', `
        <div class="field">
          <label>その他の工事内容</label>
          <textarea data-key="custom_consult" data-name="note" placeholder="例）門柱のやり替え、階段補修、土留め、サンルーム、ガレージなど">${sanitizeText(state.inputs.custom_consult.note || '')}</textarea>
          <p class="field-help">入力内容は、結果画面でまとめて確認できます。詳しく相談したい場合は、最後の「この内容で相談する」からLINEへお進みください。</p>
        </div>
      `));
    }
  });

  setBody(step, `
    ${progressPills(2)}
    ${state.validationMessage ? `<div class="validation-notice"><strong>入力が足りない項目があります</strong><p>${sanitizeText(state.validationMessage).replace(/\n/g, '<br>')}</p></div>` : ''}
    <div class="notice"><p>面積が分からない場合は、縦×横や目安選択でも進められます。</p></div>
    <div style="margin-top:16px">${blocks.join('')}</div>
  `);

  step.querySelectorAll('input, select, textarea').forEach((el) => {
    el.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      const name = e.target.dataset.name;
      if (!key || !name) return;
      state.inputs[key][name] = e.target.value;
      state.validationMessage = '';
      if (name === 'mode') render();
    });
    el.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const name = e.target.dataset.name;
      if (!key || !name) return;
      state.inputs[key][name] = e.target.value;
      state.validationMessage = '';
      if (name === 'mode' || name === 'preset') render();
    });
  });

  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 1; render(); } },
    { label: '内容を確認する', className: 'primary', onClick: goToConfirmStep },
  ]);
  return step;
}

function renderStep3() {
  const step = createStep(3, '内容を確認');
  const lines = state.selected.map((key) => {
    if (key === 'fence_mesh') {
      const v = state.inputs.fence_mesh;
      const methodMap = { new: '通常新設', core: '既存ブロック上', block_add: 'ブロック1段追加' };
      return `<div class="summary-item"><h4>メッシュフェンス</h4><div>種類：メッシュフェンス</div><div>設置方法：${methodMap[v.method]}</div><div>長さ：${v.length || '-'}m</div></div>`;
    }
    if (key === 'carport') {
      return `<div class="summary-item"><h4>カーポート</h4><div>台数：${state.inputs.carport.size}台用</div></div>`;
    }
    if (key === 'custom_consult') {
      return `<div class="summary-item"><h4>その他の工事・気になる内容</h4><div>${sanitizeText(state.inputs.custom_consult.note || '未入力')}</div></div>`;
    }
    if (['tile_deck','approach','stone_approach'].includes(key)) {
      return `<div class="summary-item"><h4>${V12_LABELS[key]}</h4><div>入力内容：${quantityInputLabel(key)}</div></div>`;
    }
    if (key === 'retaining_wall') {
      const v = state.inputs.retaining_wall;
      const h = RETAINING_HEIGHTS[v.height || 'normal']?.label || '-';
      return `<div class="summary-item"><h4>土留め・高低差調整</h4><div>種類：${RETAINING_TYPES[v.type] || '-'}</div><div>長さ：${v.length || '-'}m</div><div>高さ：${h}</div></div>`;
    }
    if (key === 'edging') return `<div class="summary-item"><h4>見切り材・境界処理</h4><div>長さ：${state.inputs.edging.length || '-'}m</div></div>`;
    if (key === 'lighting') return `<div class="summary-item"><h4>照明・ライトアップ</h4><div>箇所数：${state.inputs.lighting.count || '-'}箇所</div></div>`;
    if (key === 'drainage_adjust') return `<div class="summary-item"><h4>排水・桝まわり調整</h4><div>${DRAINAGE_TYPES[state.inputs.drainage_adjust.type] || '-'}</div></div>`;
    if (key === 'gate_post') return `<div class="summary-item"><h4>門柱・ポストまわり</h4><div>${GATE_POST_TYPES[state.inputs.gate_post.type] || '-'}</div></div>`;
    const meta = PRICE_MASTER[key];
    return `<div class="summary-item"><h4>${meta.label}</h4><div>入力内容：${quantityInputLabel(key)}</div></div>`;
  }).join('');

  setBody(step, `
    ${progressPills(3)}
    <p class="muted">この内容で概算目安を表示します。入力内容をご確認ください。</p>
    <div class="summary-meta"><span>受付番号：${state.receiptNo || '結果表示時に発行'}</span><span>エリア：${sanitizeText(getProjectArea())}</span></div>
    <div class="summary-list">${lines || '<div class="summary-item">選択された項目がありません。</div>'}</div>
  `);
  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 2; render(); } },
    { label: 'この内容で概算を見る', className: 'primary', onClick: goToResultStep },
  ]);
  return step;
}


async function submitFeedbackFromResult() {
  const value = String(state.feedbackText || '').trim();
  if (!value) {
    state.feedbackMessage = '感想を入力してください。';
    render();
    return;
  }
  const ok = await notifyEvent('feedback_submitted');
  if (ok || state.feedbackNotified) {
    state.feedbackMessage = '感想を送信しました。ご協力ありがとうございます。';
  } else {
    state.feedbackMessage = '送信できませんでした。時間をおいて再度お試しください。';
  }
  render();
}

function getSameAreaDoubleCountWarning() {
  if (!(state.selected.includes('turf') && state.selected.includes('weed_gravel'))) return '';
  const turfQ = getQuantityValue('turf');
  const weedQ = getQuantityValue('weed_gravel');
  if (!turfQ || !weedQ) return '';
  const diff = Math.abs(turfQ - weedQ);
  const base = Math.max(turfQ, weedQ);
  if (base && diff / base <= 0.1) {
    return '<div class="notice" style="margin-top:12px"><p>人工芝と防草シート＋砕石を同じ場所で入力している場合は、二重計算になることがあります。別々の範囲なら問題ありません。</p></div>';
  }
  return '';
}

function renderStep4() {
  ensureSession();
  const step = createStep(4, '概算を見る');
  const results = computeResults();
  const consultHtml = results.consult.length
    ? `<div style="margin-top:16px"><h3>ご相談内容</h3>${results.consult.map((c) => `<span class="tag">${sanitizeText(c)}</span>`).join('')}</div>`
    : '';

  setBody(step, `
    ${progressPills(4)}
    <div class="notice">
      <p>選択した工事の概算目安です。正式なお見積もりは現地確認後にご案内します。</p>
    </div>
    <div class="summary-meta result-meta"><span>受付番号：${state.receiptNo}</span><span>エリア：${sanitizeText(getProjectArea())}</span></div>
    ${getSameAreaDoubleCountWarning()}

    <div class="result-list" style="margin-top:16px">
      ${results.items.length ? results.items.map((item) => `
        <div class="result-item">
          <h4>${item.label}</h4>
          <div class="price">${formatRange(item.low, item.high)}</div>
          <div class="detail">
            ${item.inputText ? `入力内容：${item.inputText}` : item.quantity ? `入力数量：${item.quantity}${item.unit}` : '定額レンジ'}
            ${(item.rule === 'minimum' || item.rule === 'small_adjust') ? ' ／ 小規模のため最低施工金額を反映' : ''}
            ${(item.rule === 'minimum' || item.rule === 'small_adjust') ? '<br><span class="adjust-note">※ 現地確認後に金額を調整できる場合があります。</span>' : ''}
            ${item.note ? `<br>※ ${sanitizeText(item.note)}` : ''}
          </div>
        </div>
      `).join('') : '<div class="result-item"><h4>概算対象がありません</h4><div class="detail">選択内容を見直してください。</div></div>'}
    </div>

    <div class="result-total">
      <div class="muted">合計の概算目安</div>
      <div class="price">${results.items.length ? formatRange(results.totalLow, results.totalHigh) : '-'}</div>
      <p class="small estimate-note">※ 表示金額は概算の目安です。正式なお見積もりは現地確認後にご案内します。</p>
    </div>

    <div class="benefit-note">
      <strong>シミュレーターからのご相談特典</strong>
      <p>概算シミュレーターからご相談いただいた方には、工事内容に応じて特典をご案内できる場合があります。</p>
    </div>

    <div class="field-block" style="margin-top:16px">
      <div class="field-title">
        <h3>概算シミュレーターの感想</h3>
        <p>使ってみた感想や、分かりにくかった点があれば教えてください。</p>
      </div>
      <div class="field">
        <textarea id="feedback-text" ${state.feedbackNotified ? 'disabled' : ''} placeholder="例）分かりやすかった、項目が少し迷った など">${sanitizeText(state.feedbackText || '')}</textarea>
        <p class="field-help">感想をご協力いただいた方には、工事内容に応じた特典をご案内できる場合があります。</p>
        ${state.feedbackMessage ? `<p class="field-help"><strong>${sanitizeText(state.feedbackMessage)}</strong></p>` : ''}
        <button type="button" id="feedback-submit" class="ghost" ${state.feedbackNotified ? 'disabled' : ''}>感想を送る</button>
      </div>
    </div>

    ${consultHtml}
  `);

  const feedbackText = step.querySelector('#feedback-text');
  const feedbackSubmit = step.querySelector('#feedback-submit');
  if (feedbackText) {
    feedbackText.addEventListener('input', (e) => {
      state.feedbackText = e.target.value;
      state.feedbackMessage = '';
    });
  }
  if (feedbackSubmit) feedbackSubmit.addEventListener('click', submitFeedbackFromResult);

  setActions(step, [
    { label: 'この内容で相談する', className: 'primary', onClick: async () => { await notifyEvent('consult_clicked'); window.location.href = LINE_TALK_URL; } },
    { label: 'その他の工事も入力する', className: 'ghost', onClick: () => { state.selected = Array.from(new Set([...state.selected, 'custom_consult'])); state.step = 2; render(); } },
    { label: 'もう一度はじめから入力する', className: 'secondary', onClick: () => { window.location.reload(); } },
  ]);
  return step;
}

function render() {
  ensureSession();
  app.innerHTML = '';
  const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  app.appendChild(steps[state.step]());

  if (state.step >= 1 && !state.startedNotified && !state.startNotifyPending) {
    notifyStart();
  }
  if (state.step === 4 && !state.resultNotified && !state.resultNotifyPending) {
    notifyResult(buildResultPayload());
  }
}

render();
