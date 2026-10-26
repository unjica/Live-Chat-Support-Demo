#!/usr/bin/env node
// Local benchmark for diploma hypotheses H1/H3. Never run against production.
// Limits: N_LATENCY <= 110 and VISITORS <= 110 (120 events/socket/min).
// Usage: API_URL=http://127.0.0.1:43201 OPERATOR_SECRET=... node scripts/bench/latency-and-concurrency.cjs
// The backend must run with CLIENT_IP_HEADER=x-real-ip so each simulated visitor gets
// its own handshake bucket (60/min per IP); every client sends a distinct X-Real-IP.
const { io } = require("socket.io-client");
const { randomUUID } = require("crypto");
const { performance } = require("perf_hooks");
const API = process.env.API_URL || "http://127.0.0.1:43201";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";
const SECRET = process.env.OPERATOR_SECRET;
const N_LAT = Number(process.env.N_LATENCY || 100);
const VISITORS = Number(process.env.VISITORS || 100);
const PER_VISITOR = Number(process.env.PER_VISITOR || 5);
if (!SECRET) throw new Error("OPERATOR_SECRET required");
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(API)) throw new Error("Local API only");
let ip = 0;
const mk = () => {
  ip++;
  return io(API, { transports: ["websocket"], forceNew: true, reconnection: false,
    extraHeaders: { Origin: ORIGIN, "X-Real-IP": `10.${(ip >> 16) & 255}.${(ip >> 8) & 255}.${ip & 255}` } });
};
const conn = (s) => new Promise((r, j) => { s.once("connect", r); s.once("connect_error", j); });
const ack = (s, e, d) => s.timeout(10000).emitWithAck(e, d);
const stats = (a) => {
  const s = [...a].sort((x, y) => x - y), q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, min: s[0], p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s[s.length - 1],
    mean: s.reduce((x, y) => x + y, 0) / s.length };
};
const fmt = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? +v.toFixed(2) : v]));
(async () => {
  const op = mk(); await conn(op);
  if (!(await ack(op, "user_join", { role: "admin", secret: SECRET })).ok) throw new Error("operator join failed");
  // 1) Latency: visitor send -> operator receive_message, and operator reply -> visitor receive.
  const v = mk(); await conn(v);
  const cid = (await ack(v, "user_join", { role: "visitor" })).identity.conversationId;
  const waitFor = (s, content) => new Promise((r) => {
    const h = (m) => { if (m.content === content) { s.off("receive_message", h); r(performance.now()); } };
    s.on("receive_message", h);
  });
  const up = [], down = [], ackT = [];
  for (let i = 0; i < N_LAT; i++) {
    const c = `bench-${i}-${randomUUID()}`;
    const t0 = performance.now(); const got = waitFor(op, c);
    await ack(v, "send_message", { conversationId: cid, clientMessageId: randomUUID(), content: c });
    ackT.push(performance.now() - t0); up.push((await got) - t0);
    const r = `reply-${c}`; const t1 = performance.now(); const back = waitFor(v, r);
    await ack(op, "send_message", { conversationId: cid, clientMessageId: randomUUID(), content: r });
    down.push((await back) - t1);
  }
  v.disconnect(); op.disconnect();
  // Fresh operator socket: the server allows 120 events per socket per minute.
  const op2 = mk(); await conn(op2);
  if (!(await ack(op2, "user_join", { role: "admin", secret: SECRET })).ok) throw new Error("operator join failed");
  // 2) Concurrency + isolation: VISITORS connect at once, all send in parallel; operator replies to each.
  const vs = Array.from({ length: VISITORS }, mk);
  const t2 = performance.now();
  await Promise.all(vs.map(conn));
  const joins = await Promise.all(vs.map((s) => ack(s, "user_join", { role: "visitor" })));
  const connectMs = performance.now() - t2;
  const ids = joins.map((j) => j.identity.conversationId);
  const foreign = new Array(VISITORS).fill(0), own = new Array(VISITORS).fill(0);
  vs.forEach((s, i) => s.on("receive_message", (m) => (m.conversationId === ids[i] ? own[i]++ : foreign[i]++)));
  let opReceived = 0; op2.on("receive_message", () => opReceived++);
  const t3 = performance.now();
  const sends = await Promise.all(vs.flatMap((s, i) => Array.from({ length: PER_VISITOR }, (_, k) =>
    ack(s, "send_message", { conversationId: ids[i], clientMessageId: randomUUID(), content: `c${i}-${k}` }))));
  const replies = await Promise.all(ids.map((id, i) =>
    ack(op2, "send_message", { conversationId: id, clientMessageId: randomUUID(), content: `r${i}` })));
  await new Promise((r) => setTimeout(r, 1500));
  const burstMs = performance.now() - t3;
  // Order check: each visitor's history must be strictly increasing by sequence.
  const v0 = vs[0];
  const hist = (await ack(op2, "select_conversation", { conversationId: ids[0] })).history;
  const ordered = hist.every((m, i) => i === 0 || m.sequence > hist[i - 1].sequence);
  vs.forEach((s) => s.disconnect()); op2.disconnect(); void v0;
  console.log(JSON.stringify({
    date: new Date().toISOString(), node: process.version, api: API,
    latency_ms: { visitor_ack: fmt(stats(ackT)), visitor_to_operator: fmt(stats(up)), operator_to_visitor: fmt(stats(down)) },
    concurrency: {
      visitors: VISITORS, messages_per_visitor: PER_VISITOR, connect_and_join_ms: +connectMs.toFixed(1),
      send_acks_ok: sends.filter((a) => a.ok).length, sends_total: sends.length,
      replies_ok: replies.filter((a) => a.ok).length,
      operator_received: opReceived, expected_operator_received: VISITORS * PER_VISITOR + VISITORS,
      visitors_with_foreign_messages: foreign.filter((x) => x > 0).length,
      visitors_receiving_all_own: own.filter((x) => x === PER_VISITOR + 1).length,
      history_ordered_by_sequence: ordered, burst_total_ms: +burstMs.toFixed(1),
    },
  }, null, 2));
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
