const PRICE_MASTER = {
  concrete: {
    label: '土間コンクリート',
    unit: '㎡',
    brackets: [
      { max: 15, low: 12000, high: 16000 },
      { max: 50, low: 12000, high: 15000 },
      { max: 100, low: 11000, high: 13000 },
      { max: Infinity, low: 10500, high: 12000 },
    ],
    minimum: { low: 120000, high: 180000 },
  },
  gravel: {
    label: '砕石敷き', unit: '㎡',
    brackets: [
      { max: 15, low: 5500, high: 7500 },
      { max: 40, low: 4800, high: 6500 },
      { max: Infinity, low: 4300, high: 5800 },
    ],
    minimum: { low: 50000, high: 80000 },
  },
  weed_gravel: {
    label: '防草シート＋砕石敷き', unit: '㎡',
    brackets: [
      { max: 15, low: 7500, high: 10000 },
      { max: 40, low: 6500, high: 8500 },
      { max: Infinity, low: 5800, high: 7500 },
    ],
    minimum: { low: 70000, high: 100000 },
  },
  turf: {
    label: '人工芝', unit: '㎡',
    brackets: [
      { max: 15, low: 9500, high: 12000 },
      { max: 40, low: 8500, high: 10500 },
      { max: Infinity, low: 7800, high: 9500 },
    ],
    minimum: { low: 100000, high: 140000 },
  },
  privacy_fence: {
    label: '目隠しフェンス', unit: 'm',
    brackets: [{ max: Infinity, low: 22000, high: 26000 }],
    minimum: { low: 120000, high: 180000 },
  },
  block_add: {
    label: 'ブロック1段追加', unit: 'm',
    brackets: [{ max: Infinity, low: 4000, high: 5000 }],
    minimum: { low: 60000, high: 80000 },
  },
  block_new: {
    label: 'ブロック新設（ベースから）', unit: 'm',
    brackets: [{ max: Infinity, low: 12000, high: 14000 }],
    minimum: { low: 120000, high: 150000 },
  },
  carport1: { label: 'カーポート1台用', fixed: { low: 250000, high: 300000 } },
  carport2: { label: 'カーポート2台用', fixed: { low: 400000, high: 550000 } },
  concrete_break: {
    label: 'コンクリート解体',
    unit: '㎡',
    brackets: [
      { max: 10, low: 4000, high: 5500 },
      { max: 30, low: 3800, high: 5000 },
      { max: Infinity, low: 3500, high: 4500 },
    ],
    minimum: { low: 60000, high: 100000 },
  },
  block_break_top: {
    label: 'ブロック解体（上だけ）',
    unit: 'm',
    brackets: [
      { max: 10, low: 6000, high: 8000 },
      { max: 20, low: 5500, high: 7000 },
      { max: Infinity, low: 5000, high: 6500 },
    ],
    minimum: { low: 60000, high: 100000 },
  },
  block_break_base: {
    label: 'ブロック解体（ベースごと）',
    unit: 'm',
    brackets: [
      { max: 10, low: 9000, high: 12000 },
      { max: 20, low: 8000, high: 10500 },
      { max: Infinity, low: 7500, high: 9500 },
    ],
    minimum: { low: 100000, high: 150000 },
  },
  fence_remove: {
    label: 'フェンス撤去',
    unit: 'm',
    brackets: [
      { max: 10, low: 2500, high: 4000 },
      { max: 20, low: 2000, high: 3500 },
      { max: Infinity, low: 1800, high: 3000 },
    ],
    minimum: { low: 30000, high: 60000 },
  },
};

const WORK_OPTIONS = [
  { id: 'concrete', label: '土間コンクリート', note: '駐車場・アプローチなどのコンクリート舗装' },
  { id: 'gravel', label: '砕石敷き', note: '砕石のみの敷き込み' },
  { id: 'weed_gravel', label: '防草シート＋砕石敷き', note: '防草シート込みの砕石施工' },
  { id: 'turf', label: '人工芝', note: '人工芝の敷設' },
  { id: 'fence_mesh', label: 'メッシュフェンス', note: '設置方法と長さから概算' },
  { id: 'privacy_fence', label: '目隠しフェンス', note: '板塀・ルーバー系の目隠しフェンス' },
  { id: 'block_add', label: 'ブロック1段追加', note: '既存ブロック上への1段追加' },
  { id: 'block_new', label: 'ブロック新設（ベースから）', note: 'ベースから新設するブロック工事' },
  { id: 'carport', label: 'カーポート', note: '1台用・2台用・3台用相談' },
  { id: 'concrete_break', label: 'コンクリート解体', note: '既存土間や犬走りなどの解体' },
  { id: 'block_break_top', label: 'ブロック解体（上だけ）', note: '上積み部分のみ解体' },
  { id: 'block_break_base', label: 'ブロック解体（ベースごと）', note: '基礎ごと撤去する解体' },
  { id: 'fence_remove', label: 'フェンス撤去', note: '既存フェンスの撤去' },
  { id: 'custom_consult', label: 'その他の工事・気になる内容', note: '項目にない工事や迷う内容を入力できます' },
];

const AREA_KEYS = new Set(['concrete', 'gravel', 'weed_gravel', 'turf', 'concrete_break']);
const QUANTITY_KEYS = ['concrete','gravel','weed_gravel','turf','privacy_fence','block_add','block_new','concrete_break','block_break_top','block_break_base','fence_remove'];
const PRESET_AREAS = {
  approach: { label: 'アプローチ程度（約5㎡）', value: 5 },
  car1: { label: '車1台分程度（約15㎡）', value: 15 },
  car2: { label: '車2台分程度（約30㎡）', value: 30 },
  garden: { label: '庭の一部（約20㎡）', value: 20 },
  large: { label: '広めの駐車場・庭（約50㎡）', value: 50 },
};

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
  startedNotified: false,
  resultNotified: false,
  startNotifyPending: false,
  resultNotifyPending: false,
  eventNotifyPending: false,
  selectionNotified: false,
  inputNotified: false,
  consultNotified: false,
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
    custom_consult: { note: '' },
  },
};

const app = document.getElementById('app');
const STEP_LABELS = ['スタート', '工事を選ぶ', '内容を入力', '内容を確認', '概算を見る'];
const LINE_TALK_URL = 'https://line.me/R/oaMessage/%40963rsnpu';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const APP_VERSION = 'v11-session-benefit';

function fnUrl(name) {
  return `${window.location.origin}/.netlify/functions/${name}`;
}

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}
function formatRange(low, high) { return `${yen(low)} 〜 ${yen(high)}`; }
function getBracket(def, q) { return def.brackets.find((b) => q <= b.max) || def.brackets[def.brackets.length - 1]; }
function sanitizeText(value) { return String(value || '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#039;' }[c])); }

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
  if (value.mode === 'preset') return PRESET_AREAS[value.preset]?.value || 0;
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
      return `${PRESET_AREAS[value.preset]?.label || '未選択'}（約${q || '-'}㎡）`;
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
  };
}

async function notifyEvent(eventType) {
  if (state.eventNotifyPending) return;
  const notifiedKeyMap = {
    selection_complete: 'selectionNotified',
    input_complete: 'inputNotified',
    consult_clicked: 'consultNotified',
  };
  const key = notifiedKeyMap[eventType];
  if (key && state[key]) return;

  state.eventNotifyPending = true;
  try {
    const response = await fetch(fnUrl('notify-event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...buildEventPayload(eventType), appVersion: APP_VERSION }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok && key) state[key] = true;
  } catch (error) {
    console.warn('event notify failed', error);
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

function renderStep0() {
  const step = createStep(0, 'スタート');
  setBody(step, `
    ${progressPills(0)}
    ${state.sessionMessage ? `<div class="session-notice">${sanitizeText(state.sessionMessage)}</div>` : ''}
    <div class="grid">
      <div class="notice">
        <p>駐車場のコンクリート、フェンス、人工芝、カーポートなど、気になる工事の概算目安をご確認いただけます。まずは工事を選んで進んでください。</p>
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
            ${Object.entries(PRESET_AREAS).map(([presetKey, preset]) => `<option value="${presetKey}" ${input.preset === presetKey ? 'selected' : ''}>${preset.label}</option>`).join('')}
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
    <div class="notice"><p>面積が分からない場合は、縦×横や目安選択でも進められます。小さな面積や短い距離の工事でも、準備や施工条件により最低施工金額が反映される場合があります。</p></div>
    <div style="margin-top:16px">${blocks.join('')}</div>
  `);

  step.querySelectorAll('input, select, textarea').forEach((el) => {
    el.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      const name = e.target.dataset.name;
      if (!key || !name) return;
      state.inputs[key][name] = e.target.value;
      if (name === 'mode') render();
    });
    el.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const name = e.target.dataset.name;
      if (!key || !name) return;
      state.inputs[key][name] = e.target.value;
      if (name === 'mode' || name === 'preset') render();
    });
  });

  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 1; render(); } },
    { label: '内容を確認する', className: 'primary', onClick: async () => { await notifyEvent('input_complete'); state.step = 3; render(); } },
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
    { label: 'この内容で概算を見る', className: 'primary', onClick: () => { state.step = 4; render(); } },
  ]);
  return step;
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
      <p>選択された工事の概算目安です。工事項目ごとの金額を中心に表示しています。正式なお見積もりは、現地状況や施工条件を確認したうえでご案内いたします。</p>
    </div>
    <div class="summary-meta result-meta"><span>受付番号：${state.receiptNo}</span><span>エリア：${sanitizeText(getProjectArea())}</span></div>

    <div class="result-list" style="margin-top:16px">
      ${results.items.length ? results.items.map((item) => `
        <div class="result-item">
          <h4>${item.label}</h4>
          <div class="price">${formatRange(item.low, item.high)}</div>
          <div class="detail">
            ${item.inputText ? `入力内容：${item.inputText}` : item.quantity ? `入力数量：${item.quantity}${item.unit}` : '定額レンジ'}
            ${item.rule === 'minimum' ? ' ／ 小規模のため最低施工金額を反映' : ''}
          </div>
        </div>
      `).join('') : '<div class="result-item"><h4>概算対象がありません</h4><div class="detail">選択内容を見直してください。</div></div>'}
    </div>

    <div class="result-total">
      <div class="muted">合計の概算目安</div>
      <div class="price">${results.items.length ? formatRange(results.totalLow, results.totalHigh) : '-'}</div>
      <p class="small">※ 合計は参考表示です。主役は上の工事項目別表示です。</p>
    </div>

    <div class="benefit-note">
      <strong>シミュレーターからのご相談特典</strong>
      <p>概算シミュレーターからご相談いただいた方には、工事内容に応じて特典をご案内できる場合があります。</p>
    </div>

    ${consultHtml}
  `);
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
