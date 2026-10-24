// Post-deploy check for a public frontend + backend pair. Creates two short test
// conversations (prefixed "verify-"). Usage:
//   SITE_URL=https://live-chat.tacko.io API_URL=https://backend.example \
//   OPERATOR_SECRET_FILE=/path/to/secret node scripts/verify-deployment.cjs
// The operator secret is read from a file and never printed.
const fs = require('node:fs');
const tls = require('node:tls');
const { randomUUID } = require('node:crypto');
const { io } = require('socket.io-client');

const site = (process.env.SITE_URL || '').replace(/\/$/, '');
const api = (process.env.API_URL || '').replace(/\/$/, '');
const secretFile = process.env.OPERATOR_SECRET_FILE;
if (!site || !api || !secretFile) {
  console.error('Set SITE_URL, API_URL and OPERATOR_SECRET_FILE');
  process.exit(2);
}
for (const [name, u] of [['SITE_URL', site], ['API_URL', api]]) {
  if (new URL(u).protocol !== 'https:') {
    console.error(`${name} must use https://`);
    process.exit(2);
  }
}
const secret = fs.readFileSync(secretFile, 'utf8').trim();
const origin = new URL(site).origin;
const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};
const sockets = [];
const get = (u, opts = {}) => fetch(u, { ...opts, signal: AbortSignal.timeout(15000) });
const ack = (s, ev, data) => s.timeout(8000).emitWithAck(ev, data).catch((e) => ({ ok: false, error: e.message }));
const wait = (s, pred, ms = 8000) =>
  new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    s.on('receive_message', (m) => { if (pred(m)) { clearTimeout(t); resolve(m); } });
  });
function connect(o = origin) {
  const s = io(api, { transports: ['websocket'], reconnection: false, forceNew: true, extraHeaders: { Origin: o } });
  sockets.push(s);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 10000);
    s.once('connect', () => { clearTimeout(t); resolve(s); });
    s.once('connect_error', (e) => { clearTimeout(t); reject(e); });
  });
}
function cert(host) {
  return new Promise((resolve) => {
    const sock = tls.connect(443, host, { servername: host }, () => {
      const c = sock.getPeerCertificate();
      resolve({ ok: sock.authorized, until: c.valid_to, issuer: c.issuer && c.issuer.O });
      sock.end();
    });
    sock.setTimeout(10000, () => { sock.destroy(); resolve({ ok: false, until: 'TLS timeout' }); });
    sock.on('error', (e) => resolve({ ok: false, until: e.message }));
  });
}

(async () => {
  for (const u of [site, api]) {
    const c = await cert(new URL(u).hostname);
    check(`tls ${new URL(u).hostname}`, c.ok, `${c.issuer || ''} until ${c.until}`);
  }
  const pages = {};
  for (const p of ['/', '/visitor', '/admin']) {
    const r = await get(site + p, { redirect: 'manual' });
    pages[p] = await r.text();
    check(`page ${p}`, r.status === 200, `HTTP ${r.status}${r.headers.get('x-robots-tag') ? `, x-robots-tag: ${r.headers.get('x-robots-tag')}` : ''}`);
  }
  const scripts = [...new Set(Object.values(pages).join('').match(/\/_next\/static\/[^"']+\.js/g) || [])];
  let bundle = '';
  for (const s of scripts) bundle += await (await get(site + s)).text();
  check('bundle loaded', scripts.length > 0, `${scripts.length} files`);
  check('bundle points to API_URL', bundle.includes(api));
  check('bundle has no server secrets',
    !bundle.includes(secret) && !/postgres(ql)?:\/\/|OPERATOR_SECRET|DATABASE_URL/.test(bundle));
  check('api health', (await get(api)).status === 200);

  const bad = await connect('https://evil.example').then(() => false, () => true);
  check('foreign origin rejected', bad);
  const noAuth = await connect();
  check('operator wrong secret rejected', !(await ack(noAuth, 'user_join', { role: 'admin', secret: 'x'.repeat(64) })).ok);
  const op = await connect();
  check('operator auth', (await ack(op, 'user_join', { role: 'admin', secret })).ok);

  const a = await connect(), b = await connect();
  const ja = await ack(a, 'user_join', { role: 'visitor' });
  const jb = await ack(b, 'user_join', { role: 'visitor' });
  check('visitors joined (WSS)', ja.ok && jb.ok && ja.identity.conversationId !== jb.identity.conversationId);
  const ca = ja.identity.conversationId;
  const marker = `verify-${Date.now()}`;
  let leak = false;
  b.on('receive_message', (m) => { if (m.conversationId === ca) leak = true; });
  const opGot = wait(op, (m) => m.content === marker);
  await ack(a, 'send_message', { conversationId: ca, clientMessageId: randomUUID(), content: marker });
  check('visitor -> operator', !!(await opGot));
  const aGot = wait(a, (m) => m.content === `reply ${marker}`);
  await ack(op, 'send_message', { conversationId: ca, clientMessageId: randomUUID(), content: `reply ${marker}` });
  check('operator -> visitor', !!(await aGot));
  const cross = await ack(b, 'send_message', { conversationId: ca, clientMessageId: randomUUID(), content: 'intrude' });
  const sel = await ack(b, 'select_conversation', { conversationId: ca });
  await new Promise((r) => setTimeout(r, 800));
  check('isolation', !leak && !cross.ok && !sel.ok);
  a.close();
  await new Promise((r) => setTimeout(r, 1000));
  const a2 = await connect();
  const jr = await ack(a2, 'user_join', { role: 'visitor', token: ja.token });
  const hist = (jr.history || []).filter((m) => m.content.includes(marker)).length;
  check('reconnect + history', jr.ok && jr.identity.conversationId === ca && hist === 2, `${hist}/2 messages`);

  const failed = results.filter((r) => !r).length;
  console.log(failed ? `${failed} check(s) FAILED` : 'ALL PASS');
  process.exitCode = failed ? 1 : 0;
})().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; })
  .finally(() => sockets.forEach((s) => s.disconnect()));
