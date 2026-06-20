'use strict';

const { pushText } = require('./_line');
const {
  jsonResponse,
  safeError,
  validateCommonRequest,
  stripDangerousText,
  safeShort,
  safeCode,
  safeInteger,
  isMeaningfulText,
  countUrls,
  normalizeReceiptNo,
  normalizeProjectArea,
  sanitizeDeep,
  safeLineText,
  dedupe,
  getEnvTargetUserId,
} = require('./_security');

const EVENT_LABELS = {
  start: '開始',
  sim_start: '開始',
  simulator_start: '開始',
  simulatorstart: '開始',

  item_select: '工事項目選択',
  item_selected: '工事項目選択',
  select_items: '工事項目選択',
  itemselect: '工事項目選択',
  itemselected: '工事項目選択',
  selectitems: '工事項目選択',

  input_complete: '入力完了',
  input_completed: '入力完了',
  inputcomplete: '入力完了',
  inputcompleted: '入力完了',

  result_view: '結果表示',
  result_display: '結果表示',
  result_displayed: '結果表示',
  resultview: '結果表示',
  resultdisplay: '結果表示',
  resultdisplayed: '結果表示',

  line_save: 'LINE保存ボタン押下',
  line_save_click: 'LINE保存ボタン押下',
  line_save_clicked: 'LINE保存ボタン押下',
  line_save_button: 'LINE保存ボタン押下',
  line_save_button_click: 'LINE保存ボタン押下',
  line_save_button_clicked: 'LINE保存ボタン押下',
  line_save_pressed: 'LINE保存ボタン押下',
  line_saved: 'LINE保存ボタン押下',
  save_click: 'LINE保存ボタン押下',
  save_clicked: 'LINE保存ボタン押下',
  save_line: 'LINE保存ボタン押下',
  save_line_click: 'LINE保存ボタン押下',
  save_to_line: 'LINE保存ボタン押下',
  share_line: 'LINE保存ボタン押下',
  line_share: 'LINE保存ボタン押下',
  line_share_click: 'LINE保存ボタン押下',
  result_line_save: 'LINE保存ボタン押下',
  click_line_save: 'LINE保存ボタン押下',
  open_line_save: 'LINE保存ボタン押下',
  linesave: 'LINE保存ボタン押下',
  linesaveclick: 'LINE保存ボタン押下',
  linesaveclicked: 'LINE保存ボタン押下',
  linesavebutton: 'LINE保存ボタン押下',
  linesavebuttonclick: 'LINE保存ボタン押下',
  linesavebuttonclicked: 'LINE保存ボタン押下',
  linesavepressed: 'LINE保存ボタン押下',
  linesaved: 'LINE保存ボタン押下',
  saveclick: 'LINE保存ボタン押下',
  saveclicked: 'LINE保存ボタン押下',
  saveline: 'LINE保存ボタン押下',
  savelineclick: 'LINE保存ボタン押下',
  savetoline: 'LINE保存ボタン押下',
  shareline: 'LINE保存ボタン押下',
  lineshare: 'LINE保存ボタン押下',
  lineshareclick: 'LINE保存ボタン押下',
  resultlinesave: 'LINE保存ボタン押下',
  clicklinesave: 'LINE保存ボタン押下',
  openlinesave: 'LINE保存ボタン押下',

  question_click: '質問ボタン押下',
  question_clicked: '質問ボタン押下',
  question_button: '質問ボタン押下',
  question_button_click: '質問ボタン押下',
  question_button_clicked: '質問ボタン押下',
  contact_click: '質問ボタン押下',
  contact_clicked: '質問ボタン押下',
  consult_click: '質問ボタン押下',
  consult_clicked: '質問ボタン押下',
  questionclick: '質問ボタン押下',
  questionclicked: '質問ボタン押下',
  questionbutton: '質問ボタン押下',
  questionbuttonclick: '質問ボタン押下',
  questionbuttonclicked: '質問ボタン押下',
  contactclick: '質問ボタン押下',
  contactclicked: '質問ボタン押下',
  consultclick: '質問ボタン押下',
  consultclicked: '質問ボタン押下',

  feedback: '感想送信',
  feedback_submit: '感想送信',
  feedback_sent: '感想送信',
  feedbacksubmit: '感想送信',
  feedbacksent: '感想送信',
  impression_submit: '感想送信',
  impressionsubmit: '感想送信',
};

function toSnakeEventCode(raw) {
  return String(raw || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function normalizeEventType(body) {
  const raw = body.eventType || body.eventName || body.type || body.action || body.event || body.kind || '';
  const rawText = stripDangerousText(raw, 80);
  const code = safeCode(raw, '').toLowerCase();
  const snake = toSnakeEventCode(raw);
  const compact = snake.replace(/_/g, '');

  const candidates = [code, snake, compact].filter(Boolean);
  for (const candidate of candidates) {
    if (EVENT_LABELS[candidate]) return { ok: true, code: candidate, label: EVENT_LABELS[candidate] };
  }

  // Current app variations may contain Japanese labels. Keep this limited to known button actions.
  if (/line/i.test(rawText) && /(保存|送信|share|save)/i.test(rawText)) {
    return { ok: true, code: 'line_save', label: EVENT_LABELS.line_save };
  }
  if (/(質問|相談|問い合わせ|問合せ|contact|consult|question)/i.test(rawText)) {
    return { ok: true, code: 'question_click', label: EVENT_LABELS.question_click };
  }
  if (/(感想|feedback|impression)/i.test(rawText)) {
    return { ok: true, code: 'feedback', label: EVENT_LABELS.feedback };
  }

  console.warn('[notify-event] event type rejected', { code, snake, compact });
  return { ok: false, code: code || snake || compact, label: '' };
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

function feedbackText(body) {
  return body.feedbackText || body.feedback || body.impression || body.comment || body.message || body.note || '';
}

exports.handler = async (event) => {
  const checked = validateCommonRequest(event);
  if (!checked.ok) return checked.response;

  const to = getEnvTargetUserId();
  if (!to) return safeError(500, 'notify_unavailable');

  const body = checked.body;
  const eventInfo = normalizeEventType(body);
  if (!eventInfo.ok) return safeError(400, 'event_type_not_allowed');

  const receiptNo = normalizeReceiptNo(body.receiptNo);
  const projectArea = normalizeProjectArea(body.projectArea);
  const selected = Array.isArray(body.selected) ? body.selected.map((v) => safeShort(v, '', 40)).filter(Boolean).slice(0, 30) : [];
  const inputCount = safeInteger(body.inputCount || body.inputItemCount || body.enteredCount, { max: 80, fallback: 0 });
  const durationSec = safeInteger(body.durationSec || body.staySeconds || body.elapsedSeconds, { max: 21600, fallback: 0 });
  const estimatedPrice = stripDangerousText(body.estimatedPrice || body.priceText || body.totalText || '', 80);
  const textInput = feedbackText(body);
  const safeFeedback = stripDangerousText(textInput, 500);

  if (['feedback', 'feedback_submit', 'feedback_sent', 'impression_submit'].includes(eventInfo.code)) {
    if (!isMeaningfulText(safeFeedback)) return safeError(400, 'empty_or_invalid_text');
    if (countUrls(safeFeedback) > 1) return safeError(400, 'too_many_urls');
  }

  const duplicateKey = [
    'event', eventInfo.code, receiptNo, selected.join(','), estimatedPrice, safeFeedback.slice(0, 80),
  ].join(':');
  if (dedupe(duplicateKey, 12000)) {
    return jsonResponse(200, { ok: true, deduped: true });
  }

  const extra = sanitizeDeep(body.extra || body.details || body.payload || {});
  const lines = [
    '概算シミュレーター行動通知',
    `・種別: ${eventInfo.label}`,
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    selected.length ? `・項目: ${selected.join('、')}` : null,
    estimatedPrice ? `・概算: ${estimatedPrice}` : null,
    inputCount ? `・入力項目数: ${inputCount}` : null,
    durationSec ? `・滞在時間: ${durationSec}秒` : null,
    safeFeedback ? `・内容: ${safeFeedback}` : null,
    extra && Object.keys(extra).length ? `・補足: ${stripDangerousText(JSON.stringify(extra), 700)}` : null,
    `・時間: ${jstTime(body.createdAt || body.sentAt || new Date().toISOString())}`,
  ];

  try {
    await pushText(to, safeLineText(lines));
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('[notify-event] push failed', { statusCode: error.statusCode, message: error.message });
    return safeError(500, 'notify_failed');
  }
};
