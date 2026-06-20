'use strict';

const { pushText } = require('./_line');
const {
  jsonResponse,
  safeError,
  validateCommonRequest,
  normalizeReceiptNo,
  normalizeProjectArea,
  safeLineText,
  dedupe,
  getEnvTargetUserId,
} = require('./_security');

function jstTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

exports.handler = async (event) => {
  const checked = validateCommonRequest(event);
  if (!checked.ok) return checked.response;

  const to = getEnvTargetUserId();
  if (!to) return safeError(500, 'notify_unavailable');

  const body = checked.body;
  const receiptNo = normalizeReceiptNo(body.receiptNo);
  const projectArea = normalizeProjectArea(body.projectArea);
  const time = jstTime(body.startedAt || new Date().toISOString());
  const duplicateKey = `start:${receiptNo}:${projectArea}`;

  if (dedupe(duplicateKey, 15000)) {
    return jsonResponse(200, { ok: true, deduped: true });
  }

  const text = safeLineText([
    '概算シミュレーターが開始されました',
    `・受付番号: ${receiptNo}`,
    `・エリア: ${projectArea}`,
    `・時間: ${time}`,
  ]);

  try {
    await pushText(to, text);
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('[notify-start] push failed', { statusCode: error.statusCode, message: error.message });
    return safeError(500, 'notify_failed');
  }
};
