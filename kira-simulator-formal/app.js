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
  { id: 'custom_consult', label: '一覧にない工事も相談', note: '概算にない内容も最後に相談可能' },
];

const state = {
  step: 0,
  startedAt: null,
  sessionId: '',
  startedNotified: false,
  resultNotified: false,
  startNotifyPending: false,
  resultNotifyPending: false,
  selected: [],
  inputs: {
    concrete: { quantity: '' },
    gravel: { quantity: '' },
    weed_gravel: { quantity: '' },
    turf: { quantity: '' },
    fence_mesh: { type: 'mesh', method: 'new', length: '' },
    privacy_fence: { quantity: '' },
    block_add: { quantity: '' },
    block_new: { quantity: '' },
    carport: { size: '1' },
    concrete_break: { quantity: '' },
    block_break_top: { quantity: '' },
    block_break_base: { quantity: '' },
    fence_remove: { quantity: '' },
    custom_consult: { note: '' },
    customer: { name: '', phone: '', lineName: '' },
  },
};

const app = document.getElementById('app');
const STEP_LABELS = ['スタート', '工事を選ぶ', '内容を入力', '内容を確認', '概算を見る'];

function fnUrl(name) {
  return `${window.location.origin}/.netlify/functions/${name}`;
}

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}
function formatRange(low, high) { return `${yen(low)} 〜 ${yen(high)}`; }
function getBracket(def, q) { return def.brackets.find((b) => q <= b.max) || def.brackets[def.brackets.length - 1]; }

function calcFromMaster(key, quantity) {
  const def = PRICE_MASTER[key];
  if (!def || !quantity || quantity <= 0) return null;
  if (def.fixed) return { label: def.label, low: def.fixed.low, high: def.fixed.high, quantity: null, unit: null, rule: 'fixed' };
  const bracket = getBracket(def, quantity);
  let low = quantity * bracket.low;
  let high = quantity * bracket.high;
  let minimumApplied = false;
  if (def.minimum) {
    if (low < def.minimum.low) {
      low = def.minimum.low;
      minimumApplied = true;
    }
    if (high < def.minimum.high) {
      high = def.minimum.high;
      minimumApplied = true;
    }
  }
  return {
    label: def.label,
    low,
    high,
    quantity,
    unit: def.unit,
    rule: minimumApplied ? 'minimum' : 'unit',
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
    meta: { type, method, variant },
  };
}

function computeResults() {
  const items = [];
  const consult = [];

  for (const key of state.selected) {
    if (['concrete','gravel','weed_gravel','turf','privacy_fence','block_add','block_new','concrete_break','block_break_top','block_break_base','fence_remove'].includes(key)) {
      const result = calcFromMaster(key, Number(state.inputs[key].quantity));
      if (result) items.push(result);
    }
    if (key === 'fence_mesh') {
      const result = calcMeshFence(state.inputs.fence_mesh);
      if (result) items.push(result);
    }
    if (key === 'carport') {
      const size = state.inputs.carport.size;
      if (size === '1') items.push({ ...calcFromMaster('carport1', 1), label: 'カーポート1台用' });
      else if (size === '2') items.push({ ...calcFromMaster('carport2', 1), label: 'カーポート2台用' });
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
  state.sessionId = state.sessionId || `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const response = await fetch(fnUrl('notify-start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startedAt: state.startedAt, sessionId: state.sessionId, userAgent: navigator.userAgent, appVersion: 'v8-public-release' }),
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
      body: JSON.stringify({ ...payload, appVersion: 'v8-public-release' }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) state.resultNotified = true;
  } catch (error) {
    console.warn('result notify failed', error);
  } finally {
    state.resultNotifyPending = false;
  }
}

function buildResultPayload() {
  const results = computeResults();
  return {
    displayedAt: new Date().toISOString(),
    sessionId: state.sessionId || `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    <div class="grid">
      <div class="notice">
        <p>駐車場のコンクリート、フェンス、人工芝、カーポートなど、気になる工事の概算目安をご確認いただけます。まずは工事を選んで進んでください。</p>
      </div>
      <div class="subnotice">
        <p>※ 表示金額は概算の目安です。現地状況や施工条件により変動します。正式なお見積もりは現地確認後にご案内いたします。</p>
      </div>
    </div>
  `);
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
    { label: '次へ', className: 'primary', disabled: state.selected.length === 0, onClick: () => { state.step = 2; render(); } },
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

function renderStep2() {
  const step = createStep(2, '内容を入力');
  const blocks = [];

  state.selected.forEach((key) => {
    if (['concrete','gravel','weed_gravel','turf','privacy_fence','block_add','block_new','concrete_break','block_break_top','block_break_base','fence_remove'].includes(key)) {
      const meta = PRICE_MASTER[key];
      blocks.push(fieldBlock(meta.label, `${meta.unit}数をご入力ください。数量をもとに概算目安を算出します。`, `
        <div class="field-row">
          <div class="field">
            <label>${meta.unit}数</label>
            <input type="number" min="0" step="0.1" data-key="${key}" data-name="quantity" value="${state.inputs[key].quantity}" placeholder="例）12" />
          </div>
        </div>
      `));
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
        <div class="field-row">
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
      blocks.push(fieldBlock('一覧にない工事も相談', '気になる内容や工事名があればご入力ください。', `
        <div class="field">
          <label>相談したい内容</label>
          <textarea data-key="custom_consult" data-name="note" placeholder="例）門柱のやり替え、階段補修、土留めの相談など">${state.inputs.custom_consult.note || ''}</textarea>
        </div>
      `));
    }
  });

  blocks.push(fieldBlock('ご相談時メモ（任意）', 'あとでご相談しやすいよう、任意でご入力いただけます。', `
    <div class="field-row">
      <div class="field">
        <label>お名前</label>
        <input type="text" data-key="customer" data-name="name" value="${state.inputs.customer.name}" placeholder="例）山田" />
      </div>
      <div class="field">
        <label>電話番号</label>
        <input type="text" data-key="customer" data-name="phone" value="${state.inputs.customer.phone}" placeholder="例）090-1234-5678" />
      </div>
      <div class="field">
        <label>LINE名</label>
        <input type="text" data-key="customer" data-name="lineName" value="${state.inputs.customer.lineName}" placeholder="例）ヤマダ様" />
      </div>
    </div>
  `));

  setBody(step, `
    ${progressPills(2)}
    <div class="notice"><p>選んだ項目だけ表示しています。小さな面積や短い距離の工事でも、準備や施工条件により最低施工金額が反映される場合があります。</p></div>
    <div style="margin-top:16px">${blocks.join('')}</div>
  `);

  step.querySelectorAll('input, select, textarea').forEach((el) => {
    el.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      const name = e.target.dataset.name;
      state.inputs[key][name] = e.target.value;
    });
  });

  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 1; render(); } },
    { label: '内容を確認する', className: 'primary', onClick: () => { state.step = 3; render(); } },
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
      return `<div class="summary-item"><h4>一覧にない工事も相談</h4><div>${state.inputs.custom_consult.note || '未入力'}</div></div>`;
    }
    const meta = PRICE_MASTER[key];
    return `<div class="summary-item"><h4>${meta.label}</h4><div>${meta.unit}数：${state.inputs[key].quantity || '-'}</div></div>`;
  }).join('');

  setBody(step, `
    ${progressPills(3)}
    <p class="muted">この内容で概算目安を表示します。入力内容をご確認ください。</p>
    <div class="summary-list">${lines || '<div class="summary-item">選択された項目がありません。</div>'}</div>
  `);
  setActions(step, [
    { label: '戻る', className: 'secondary', onClick: () => { state.step = 2; render(); } },
    { label: 'この内容で概算を見る', className: 'primary', onClick: () => { state.step = 4; render(); } },
  ]);
  return step;
}

function renderStep4() {
  const step = createStep(4, '概算を見る');
  const results = computeResults();
  const consultHtml = results.consult.length
    ? `<div style="margin-top:16px"><h3>ご相談内容</h3>${results.consult.map((c) => `<span class="tag">${c}</span>`).join('')}</div>`
    : '';

  setBody(step, `
    ${progressPills(4)}
    <div class="notice">
      <p>選択された工事の概算目安です。工事項目ごとの金額を中心に表示しています。正式なお見積もりは、現地状況や施工条件を確認したうえでご案内いたします。</p>
    </div>

    <div class="result-list" style="margin-top:16px">
      ${results.items.length ? results.items.map((item) => `
        <div class="result-item">
          <h4>${item.label}</h4>
          <div class="price">${formatRange(item.low, item.high)}</div>
          <div class="detail">
            ${item.quantity ? `入力数量：${item.quantity}${item.unit}` : '定額レンジ'}
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

    ${consultHtml}
  `);
  setActions(step, [
    { label: 'この内容で相談する', className: 'primary', onClick: () => alert('相談導線の接続先を設定してください。') },
    { label: '一覧にない工事も相談する', className: 'ghost', onClick: () => { state.selected = Array.from(new Set([...state.selected, 'custom_consult'])); state.step = 2; render(); } },
    { label: 'もう一度はじめから入力する', className: 'secondary', onClick: () => { window.location.reload(); } },
  ]);
  return step;
}

function render() {
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
