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
  item_select: '工事項目選択',
  item_selected: '工事項目選択',
  select_items: '工事項目選択',
  input_complete: '入力完了',
  input_completed: '入力完了',
  result_view: '結果表示',
  result_display: '結果表示',
  result_displayed: '結果表示',
  line_save: 'LINE保存',
  line_save_click: 'LINE保存',
  save_click: 'LINE保存',
  save_line: 'LINE保存',
  question_click: '質問ボタン押下',
  question_clicked: '質問ボタン押下',
  contact_click: '質問ボタン押下',
  consult_click: '質問ボタン押下',
  feedback: '感想送信',
  feedback_submit: '感想送信',
  feedback_sent: '感想送信',
  impression_submit: '感想送信',
};

function jstTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function normalizeEventType(body) {
  const raw = body.eventType || body.eventName || body.type || body.action || body.event || '';
  const code = safeCode(raw, '').toLowerCase();
  if (!code || !EVENT_LABELS[code]) return { ok: false, code, label: '' };
  return { ok: true, code, label: EVENT_LABELS[code] };
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
