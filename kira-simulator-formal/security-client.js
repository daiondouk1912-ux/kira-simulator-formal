/* KirA 外構概算シミュレーター v13.9 client-side security helper
 * 役割: 通知系fetchの軽い重複防止・文字数制限・危険文字無害化。
 * 注意: 本当の防御はNetlify Functions側で行います。このファイルは通常利用の連打を減らす補助です。
 */
(function () {
  'use strict';

  var VERSION = 'v13.9-security-client';
  var NOTIFY_RE = /\/(\.netlify\/functions|api)\/notify-(start|result|event)\b/;
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!originalFetch || window.__KIRA_SECURITY_CLIENT_INSTALLED__) return;
  window.__KIRA_SECURITY_CLIENT_INSTALLED__ = true;

  function stripText(value, max) {
    var text = String(value == null ? '' : value);
    text = text.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    text = text.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
    text = text.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/javascript\s*:/gi, '');
    if (text.length > max) text = text.slice(0, max) + '…';
    return text;
  }

  function sanitizeDeep(value, depth) {
    if (depth > 5) return '[省略]';
    if (value == null) return value;
    if (typeof value === 'string') return stripText(value, depth >= 3 ? 160 : 500);
    if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, Math.min(99999999, value)) : 0;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 30).map(function (item) { return sanitizeDeep(item, depth + 1); });
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).slice(0, 60).forEach(function (key) {
        var cleanKey = String(key).replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 50);
        if (cleanKey) out[cleanKey] = sanitizeDeep(value[key], depth + 1);
      });
      return out;
    }
    return String(value).slice(0, 120);
  }

  function hashSmall(text) {
    var h = 0;
    for (var i = 0; i < text.length; i += 1) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
    return String(h);
  }

  function alreadySent(key, ttlMs) {
    var now = Date.now();
    try {
      var raw = sessionStorage.getItem('kira_notify_dedupe') || '{}';
      var store = JSON.parse(raw);
      Object.keys(store).forEach(function (k) { if (store[k] <= now) delete store[k]; });
      if (store[key] && store[key] > now) {
        sessionStorage.setItem('kira_notify_dedupe', JSON.stringify(store));
        return true;
      }
      store[key] = now + ttlMs;
      sessionStorage.setItem('kira_notify_dedupe', JSON.stringify(store));
    } catch (e) {}
    return false;
  }

  window.fetch = function kiraSecureFetch(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var options = init || {};
    if (!NOTIFY_RE.test(url)) return originalFetch(input, init);

    try {
      if (options && typeof options.body === 'string') {
        var body = JSON.parse(options.body || '{}');
        body = sanitizeDeep(body, 0);
        body.clientVersion = VERSION;
        body.sentAtClient = new Date().toISOString();
        var nextBody = JSON.stringify(body);
        if (nextBody.length > 30000) {
          return Promise.resolve(new Response(JSON.stringify({ ok: false, reason: 'payload_too_large' }), {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        var key = 'notify:' + hashSmall(url + ':' + nextBody.slice(0, 1200));
        if (alreadySent(key, 9000)) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, deduped: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        options = Object.assign({}, options, {
          headers: Object.assign({}, options.headers || {}, {
            'Content-Type': 'application/json',
            'X-Kira-Client': VERSION,
          }),
          body: nextBody,
        });
      }
    } catch (e) {
      // 既存挙動を壊さないため、整形できない場合はそのまま送る。
    }
    return originalFetch(input, options);
  };

  document.addEventListener('click', function (event) {
    var el = event.target && event.target.closest ? event.target.closest('button, a') : null;
    if (!el) return;
    var label = (el.textContent || '').trim();
    if (!/(LINE|保存|質問|感想|送信|相談)/.test(label)) return;
    if (el.dataset.kiraLock === '1') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    el.dataset.kiraLock = '1';
    if (el.tagName === 'BUTTON') el.disabled = true;
    window.setTimeout(function () {
      el.dataset.kiraLock = '0';
      if (el.tagName === 'BUTTON') el.disabled = false;
    }, 2500);
  }, true);
})();
