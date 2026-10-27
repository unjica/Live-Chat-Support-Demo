import "reflect-metadata";
import { INestApplication, Logger } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { randomUUID } from "crypto";

import { ChatService } from "../src/chat.service";
import { PrismaService } from "../src/prisma.service";

type Reply = {
  ok: boolean;
  code?: string;
  token: string;
  identity: { id: string; conversationId: string };
  history: { content: string; sequence: number }[];
  message: { id: string; senderId: string; sequence: number };
  operatorLastReadSequence?: number;
};
const secret = "integration-only-secret-32-characters-long";
let app: INestApplication, url: string, db: PrismaService;
const sockets: Socket[] = [];
const ids: string[] = [];
async function connect(origin?: string) {
  const socket = io(url, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    extraHeaders: origin ? { Origin: origin } : undefined,
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return socket;
}
const ack = (s: Socket, event: string, data: unknown): Promise<Reply> =>
  s.timeout(3000).emitWithAck(event, data);
async function visitor() {
  const s = await connect();
  const r = await ack(s, "user_join", { role: "visitor" });
  ids.push(r.identity.conversationId);
  return { s, r };
}
const delay = () => new Promise((resolve) => setTimeout(resolve, 100));
beforeAll(async () => {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Set DATABASE_URL to a migrated, dedicated real PostgreSQL test database",
    );
  process.env.OPERATOR_SECRET = secret;
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../src/main");
  app = await createApp();
  await app.listen(0, "127.0.0.1");
  url = await app.getUrl();
  db = app.get(PrismaService);
});
afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  if (db) await db.conversation.deleteMany({ where: { id: { in: ids } } });
  await app?.close();
});
test("H2: Nest HTTP health and Socket.IO exchange", async () => {
  expect(await (await fetch(url)).json()).toEqual({ status: "ok" });
  const { s, r } = await visitor();
  expect(r.ok).toBe(true);
  const reply = await ack(s, "send_message", {
    conversationId: r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "hello",
  });
  expect(reply.ok).toBe(true);
});
test("H1: concurrent visitors isolated; operator replies and typing scoped", async () => {
  const [a, b] = await Promise.all([visitor(), visitor()]);
  const op = await connect();
  expect((await ack(op, "user_join", { role: "admin", secret })).ok).toBe(true);
  const am: unknown[] = [],
    bm: unknown[] = [],
    om: unknown[] = [],
    bt: unknown[] = [];
  a.s.on("receive_message", (m) => am.push(m));
  b.s.on("receive_message", (m) => bm.push(m));
  op.on("receive_message", (m) => om.push(m));
  b.s.on("user_typing", (m) => bt.push(m));
  await Promise.all([
    ack(a.s, "send_message", {
      conversationId: a.r.identity.conversationId,
      clientMessageId: randomUUID(),
      content: "A",
    }),
    ack(b.s, "send_message", {
      conversationId: b.r.identity.conversationId,
      clientMessageId: randomUUID(),
      content: "B",
    }),
  ]);
  await ack(op, "send_message", {
    conversationId: a.r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "reply A",
  });
  await ack(op, "send_message", {
    conversationId: b.r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "reply B",
  });
  await ack(op, "typing_start", {
    conversationId: a.r.identity.conversationId,
  });
  await delay();
  expect(am).toEqual([
    expect.objectContaining({ content: "A" }),
    expect.objectContaining({ content: "reply A", senderId: "operator" }),
  ]);
  expect(bm).toEqual([
    expect.objectContaining({ content: "B" }),
    expect.objectContaining({ content: "reply B", senderId: "operator" }),
  ]);
  expect(om).toHaveLength(4);
  expect(bt).toHaveLength(0);
  expect(
    (
      await ack(op, "select_conversation", {
        conversationId: b.r.identity.conversationId,
      })
    ).history.map((m) => m.content),
  ).toEqual(["B", "reply B"]);
});
test("H1: unauthorized roles, tokens, history, typing, sends and spoofing rejected", async () => {
  const a = await visitor(),
    b = await visitor(),
    s = await connect();
  expect(
    (await ack(s, "user_join", { role: "admin", secret: "wrong" })).ok,
  ).toBe(false);
  expect(
    (await ack(s, "user_join", { role: "visitor", token: "guess" })).ok,
  ).toBe(false);
  for (const event of ["select_conversation", "typing_start", "typing_stop"])
    expect(
      (await ack(a.s, event, { conversationId: b.r.identity.conversationId }))
        .ok,
    ).toBe(false);
  const payload = {
    conversationId: b.r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "attack",
  };
  expect((await ack(a.s, "send_message", payload)).ok).toBe(false);
  expect((await ack(s, "send_message", payload)).ok).toBe(false);
  expect(
    (
      await ack(a.s, "send_message", {
        ...payload,
        conversationId: a.r.identity.conversationId,
        senderId: "operator",
      })
    ).ok,
  ).toBe(false);
  expect((await ack(a.s, "user_join", { role: "admin", secret })).ok).toBe(
    false,
  );
});
test("H3: ordered messages, duplicate prevention, reconnect history and communication", async () => {
  const { s, r } = await visitor();
  const conversationId = r.identity.conversationId;
  const clientMessageId = randomUUID();
  const broadcasts: unknown[] = [];
  s.on("receive_message", (m) => broadcasts.push(m));
  const first = await ack(s, "send_message", {
    conversationId,
    clientMessageId,
    content: "first",
  });
  const retries = await Promise.all(
    Array.from({ length: 3 }, () =>
      ack(s, "send_message", {
        conversationId,
        clientMessageId,
        content: "first",
      }),
    ),
  );
  expect(retries.every((m) => m.message.id === first.message.id)).toBe(true);
  await delay();
  expect(broadcasts).toHaveLength(1);
  for (const content of ["second", "third"])
    expect(
      (
        await ack(s, "send_message", {
          conversationId,
          clientMessageId: randomUUID(),
          content,
        })
      ).ok,
    ).toBe(true);
  s.disconnect();
  const restored = await connect();
  const joined = await ack(restored, "user_join", {
    role: "visitor",
    token: r.token,
  });
  expect(joined.identity).toEqual(r.identity);
  expect(joined.history.map((m) => m.content)).toEqual([
    "first",
    "second",
    "third",
  ]);
  expect(joined.history.map((m) => m.sequence)).toEqual(
    [...joined.history.map((m) => m.sequence)].sort((a, b) => a - b),
  );
  expect(
    (
      await ack(restored, "send_message", {
        conversationId,
        clientMessageId: randomUUID(),
        content: "after reconnect",
      })
    ).ok,
  ).toBe(true);
});
test("validation rejects malformed, oversized and empty messages", async () => {
  const { s, r } = await visitor();
  for (const content of ["", " ", "x".repeat(4001)])
    expect(
      (
        await ack(s, "send_message", {
          conversationId: r.identity.conversationId,
          clientMessageId: randomUUID(),
          content,
        })
      ).ok,
    ).toBe(false);
  expect((await ack(s, "send_message", null)).ok).toBe(false);
});
test("WebSocket handshake rejects disallowed browser origin", async () => {
  await expect(connect("https://untrusted.invalid")).rejects.toThrow();
});

test("H1: one disconnected tab does not mark another authorized tab offline", async () => {
  const a = await visitor();
  const second = await connect();
  await ack(second, "user_join", { role: "visitor", token: a.r.token });
  a.s.disconnect();
  const op = await connect();
  const reply = await op
    .timeout(3000)
    .emitWithAck("user_join", { role: "admin", secret });
  expect(reply.online).toContain(a.r.identity.conversationId);
  const row = await db.conversation.findUniqueOrThrow({
    where: { id: a.r.identity.conversationId },
  });
  expect(row.tokenHash).not.toBe(a.r.token);
  expect(row.tokenHash).toHaveLength(64);
});

test("join failure clears identity/rooms and permits retry on the same socket", async () => {
  const a = await visitor();
  const s = await connect();
  const chat = app.get(ChatService);
  const logging = jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  const failure = jest.spyOn(chat, "history").mockRejectedValueOnce(new Error("test database failure"));
  try {
    const rejected = await ack(s, "user_join", { role: "visitor", token: a.r.token });
    expect(rejected.ok).toBe(false);
    expect(rejected.code).toBeUndefined();
    expect(logging).toHaveBeenCalledWith("Socket request rejected (Error)", expect.any(String));
    expect(JSON.stringify(logging.mock.calls)).not.toContain("test database failure");
    expect(JSON.stringify(logging.mock.calls)).not.toContain(a.r.token);
    const leaked: unknown[] = [];
    s.on("receive_message", (m) => leaked.push(m));
    await ack(a.s, "send_message", {
      conversationId: a.r.identity.conversationId,
      clientMessageId: randomUUID(), content: "must not leak to failed join",
    });
    await delay();
    expect(leaked).toHaveLength(0);
    expect((await ack(s, "select_conversation", { conversationId: a.r.identity.conversationId })).ok).toBe(false);
    expect((await ack(s, "user_join", { role: "visitor", token: a.r.token })).ok).toBe(true);
  } finally { failure.mockRestore(); logging.mockRestore(); }
});

test("authentication code is distinct from validation and concurrent first retries broadcast once", async () => {
  const s = await connect();
  expect((await ack(s, "user_join", { role: "visitor", token: "stale" })).code).toBe("UNAUTHORIZED");
  expect((await ack(s, "user_join", { role: "invalid" })).code).toBeUndefined();
  const a = await visitor();
  const broadcasts: unknown[] = [];
  a.s.on("receive_message", (m) => broadcasts.push(m));
  const payload = { conversationId: a.r.identity.conversationId, clientMessageId: randomUUID(), content: "concurrent first send" };
  const replies = await Promise.all(Array.from({ length: 4 }, () => ack(a.s, "send_message", payload)));
  expect(replies.every((r) => r.ok && r.message.id === replies[0].message.id)).toBe(true);
  await delay();
  expect(broadcasts).toHaveLength(1);
  expect(await db.message.count({ where: { conversationId: payload.conversationId } })).toBe(1);
});

test("expired and inactive visitor credentials cannot join or access history", async () => {
  const a = await visitor();
  await db.conversation.update({ where: { id: a.r.identity.conversationId }, data: { status: "closed" } });
  expect((await ack(a.s, "select_conversation", { conversationId: a.r.identity.conversationId })).code).toBe("UNAUTHORIZED");
  const s = await connect();
  expect((await ack(s, "user_join", { role: "visitor", token: a.r.token })).code).toBe("UNAUTHORIZED");
  await db.conversation.update({ where: { id: a.r.identity.conversationId }, data: { status: "active", createdAt: new Date(Date.now() - 31 * 86400000) } });
  expect((await ack(s, "user_join", { role: "visitor", token: a.r.token })).code).toBe("UNAUTHORIZED");
});

test("join abuse is rejected before authentication and DB work", async () => {
  const s = await connect();
  for (let i = 0; i < 5; i++) expect((await ack(s, "user_join", { role: "admin", secret: "wrong" })).code).toBe("UNAUTHORIZED");
  expect((await ack(s, "user_join", { role: "admin", secret })).ok).toBe(false);
});

test("health returns a generic 503 when the database query fails", async () => {
  const failure = jest.spyOn(db, "$queryRaw").mockRejectedValueOnce(new Error("private connection detail"));
  try {
    const response = await fetch(url);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private connection detail");
  } finally { failure.mockRestore(); }
});

test("visitor expiry disconnects the socket and removes conversation room access", async () => {
  const a = await visitor();
  a.s.disconnect();
  await db.conversation.update({ where: { id: a.r.identity.conversationId }, data: { createdAt: new Date(Date.now() - 30 * 86400000 + 1500) } });
  const restored = await connect();
  expect((await ack(restored, "user_join", { role: "visitor", token: a.r.token })).ok).toBe(true);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Expired socket remained connected")), 3000);
    restored.once("disconnect", (reason) => {
      clearTimeout(timer);
      expect(reason).toBe("io server disconnect");
      resolve();
    });
  });
  const retry = await connect();
  expect((await ack(retry, "user_join", { role: "visitor", token: a.r.token })).code).toBe("UNAUTHORIZED");
});

test("event abuse counts invalid payloads and prevents further writes", async () => {
  const a = await visitor();
  for (let i = 0; i < 120; i++) expect((await ack(a.s, "send_message", null)).ok).toBe(false);
  expect((await ack(a.s, "send_message", { conversationId: a.r.identity.conversationId, clientMessageId: randomUUID(), content: "over limit" })).ok).toBe(false);
  expect(await db.message.count({ where: { conversationId: a.r.identity.conversationId } })).toBe(0);
});

test("H3: history survives a full Nest process lifecycle and replies still work", async () => {
  const a = await visitor();
  const conversationId = a.r.identity.conversationId;
  await ack(a.s, "send_message", {
    conversationId,
    clientMessageId: randomUUID(),
    content: "persisted across server restart",
  });
  sockets.forEach((s) => s.disconnect());
  await app.close();
  const { createApp } = await import("../src/main");
  app = await createApp();
  await app.listen(0, "127.0.0.1");
  url = await app.getUrl();
  db = app.get(PrismaService);
  const s = await connect();
  const restored = await ack(s, "user_join", {
    role: "visitor",
    token: a.r.token,
  });
  expect(restored.history.map((m) => m.content)).toEqual([
    "persisted across server restart",
  ]);
  const op = await connect();
  await ack(op, "user_join", { role: "admin", secret });
  const received = new Promise<{ content: string }>((resolve) =>
    s.once("receive_message", resolve),
  );
  expect(
    (
      await ack(op, "send_message", {
        conversationId,
        clientMessageId: randomUUID(),
        content: "reply after restart",
      })
    ).ok,
  ).toBe(true);
  expect((await received).content).toBe("reply after restart");
});

test("conversations list newest activity first; mark-read persists on select", async () => {
  const older = await visitor();
  await ack(older.s, "send_message", {
    conversationId: older.r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "older-msg",
  });
  await delay();
  const newer = await visitor();
  await ack(newer.s, "send_message", {
    conversationId: newer.r.identity.conversationId,
    clientMessageId: randomUUID(),
    content: "newer-msg",
  });
  const op = await connect();
  const join = await ack(op, "user_join", { role: "admin", secret });
  expect(join.ok).toBe(true);
  const list = await app.get(ChatService).list();
  const ids = list.map((c) => c.id);
  expect(ids.indexOf(newer.r.identity.conversationId)).toBeLessThan(
    ids.indexOf(older.r.identity.conversationId),
  );
  expect(list.find((c) => c.id === older.r.identity.conversationId)?.operatorLastReadSequence).toBeNull();
  const selected = await ack(op, "select_conversation", {
    conversationId: older.r.identity.conversationId,
  });
  expect(selected.ok).toBe(true);
  expect(typeof selected.operatorLastReadSequence).toBe("number");
  const again = await app.get(ChatService).list();
  const olderMeta = again.find((c) => c.id === older.r.identity.conversationId);
  expect(olderMeta?.operatorLastReadSequence).toBe(selected.operatorLastReadSequence);
});

test("visitor_presence left when the last visitor socket disconnects", async () => {
  const v = await visitor();
  const op = await connect();
  expect((await ack(op, "user_join", { role: "admin", secret })).ok).toBe(true);
  const events: { conversationId: string; online: boolean }[] = [];
  op.on("visitor_presence", (p) => events.push(p));
  v.s.disconnect();
  await delay();
  await delay();
  expect(events.some((e) => e.conversationId === v.r.identity.conversationId && e.online === false)).toBe(true);
});
