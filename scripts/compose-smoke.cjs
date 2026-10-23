// Run only against a disposable Compose database. No production credentials/data.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { io } = require('socket.io-client');
const url = process.env.SMOKE_API_URL || 'http://localhost:3001';
const origin = process.env.SMOKE_FRONTEND_URL || 'http://localhost:3000';
const sockets = [];
const ack = async (s, event, payload) => {
  const r = await s.timeout(5000).emitWithAck(event, payload);
  assert.equal(r.ok, true, `${event}: ${r.code || r.error}`);
  return r;
};
async function connect() {
  const s = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: origin } });
  sockets.push(s);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Connection timeout')), 10000);
    s.once('connect', () => { clearTimeout(timer); resolve(); });
    s.once('connect_error', e => { clearTimeout(timer); reject(e); });
  });
  return s;
}
(async () => {
  assert.equal((await fetch(url, { signal: AbortSignal.timeout(10000) })).status, 200);
  assert.equal((await fetch(origin, { signal: AbortSignal.timeout(10000) })).status, 200);
  const a = await connect(), b = await connect(), op = await connect();
  const ar = await ack(a, 'user_join', { role: 'visitor' });
  const br = await ack(b, 'user_join', { role: 'visitor' });
  assert.notEqual(ar.identity.conversationId, br.identity.conversationId);
  await ack(op, 'user_join', { role: 'admin', secret: process.env.OPERATOR_SECRET });
  const am = [], bm = [], om = [];
  a.on('receive_message', m => am.push(m.content));
  b.on('receive_message', m => bm.push(m.content));
  op.on('receive_message', m => om.push(m.content));
  const send = (s, id, content) => ack(s, 'send_message', { conversationId: id, content, clientMessageId: randomUUID() });
  await send(a, ar.identity.conversationId, 'visitor A');
  await send(b, br.identity.conversationId, 'visitor B');
  await send(op, ar.identity.conversationId, 'reply A');
  await send(op, br.identity.conversationId, 'reply B');
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.deepEqual(am, ['visitor A', 'reply A']);
  assert.deepEqual(bm, ['visitor B', 'reply B']);
  assert.deepEqual(om, ['visitor A', 'visitor B', 'reply A', 'reply B']);
  console.log('PASS: HTTP health, frontend, WebSocket authentication, 2 isolated visitors, 4 messages');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => sockets.forEach(s => s.disconnect()));
