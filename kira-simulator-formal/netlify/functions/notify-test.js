const { pushText, json } = require('./_line');

exports.handler = async () => {
  const to = process.env.LINE_TARGET_USER_ID || '';
  if (!to) {
    return json(400, { ok: false, reason: 'LINE_TARGET_USER_ID is not set' });
  }
  const text = ['LINE通知テストです。', 'このメッセージが届けば push 送信は成功です。'].join('\n');
  try {
    await pushText(to, text);
    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, { ok: false, reason: error.message });
  }
};
