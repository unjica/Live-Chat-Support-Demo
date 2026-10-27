import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useChatStore, ConversationMeta } from "@/store/chatStore";
import { Message, UserRole } from "@/types";
import {
  clearVisitorToken,
  getVisitorToken,
  setVisitorToken,
} from "@/lib/visitorStorage";
export const useErrorStore = create<{
  error: string | null;
  setError: (error: string | null) => void;
}>((set) => ({ error: null, setError: (error) => set({ error }) }));
export const useConnectionStore = create<{
  status: string;
  ready: boolean;
  conversationId: string | null;
}>(() => ({ status: "Not connected", ready: false, conversationId: null }));
let socket: Socket;
let generation = 0;
let credentials: {
  role: "visitor" | "admin";
  token?: string;
  secret?: string;
} | null = null;
type ConversationListItem = {
  id: string;
  createdAt?: string | number | Date;
  lastActivityAt?: string | number | Date;
  operatorLastReadSequence?: number | null;
  lastMessage?: {
    content?: string;
    senderId?: string;
    sequence?: number;
    createdAt?: string | number | Date;
  } | null;
};
type Reply = {
  ok: boolean;
  error?: string;
  code?: string;
  identity?: { id: string; role: "visitor" | "admin"; conversationId?: string };
  token?: string;
  history?: Message[];
  conversations?: ConversationListItem[];
  online?: string[];
  message?: Message;
  operatorLastReadSequence?: number;
};
function toMs(v: string | number | Date | undefined): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : undefined;
}
function applyConversationList(list: ConversationListItem[]) {
  const state = useChatStore.getState();
  for (const c of list) {
    const meta: ConversationMeta = {
      id: c.id,
      createdAt: toMs(c.createdAt),
      lastActivityAt: toMs(c.lastActivityAt) ?? toMs(c.createdAt),
      operatorLastReadSequence: c.operatorLastReadSequence,
      lastPreview: c.lastMessage?.content,
      lastSenderId: c.lastMessage?.senderId,
      lastSequence: c.lastMessage?.sequence,
    };
    state.upsertConversationMeta(meta);
  }
  useChatStore.setState((s) => ({
    conversations: {
      ...Object.fromEntries(list.map((c) => [c.id, s.conversations[c.id] || []])),
      ...s.conversations,
    },
  }));
}
async function request(event: string, payload: unknown): Promise<Reply> {
  try {
    return await getSocket().timeout(10000).emitWithAck(event, payload);
  } catch {
    return { ok: false, error: "Server did not respond. Please retry." };
  }
}
async function join() {
  if (!credentials) return;
  const currentGeneration = generation;
  useConnectionStore.setState({
    status: "Restoring conversation…",
    ready: false,
  });
  let reply = await request("user_join", credentials);
  if (generation !== currentGeneration) return;
  if (
    !reply.ok &&
    reply.code === "UNAUTHORIZED" &&
    credentials?.role === "visitor" &&
    credentials.token
  ) {
    clearVisitorToken();
    credentials = { role: "visitor" };
    pending = null;
    useChatStore.getState().clearChat();
    useChatStore.setState({ user: null, selectedVisitorId: null });
    useConnectionStore.setState({ conversationId: null });
    reply = await request("user_join", credentials);
  }
  if (generation !== currentGeneration) return;
  if (!reply.ok || !reply.identity) {
    useConnectionStore.setState({
      status: "Could not join. Retry login or reconnect.",
      ready: false,
    });
    useErrorStore.getState().setError(reply.error || "Authentication failed");
    return;
  }
  if (reply.token) {
    setVisitorToken(reply.token);
    credentials.token = reply.token;
  }
  const state = useChatStore.getState();
  state.setUser({
    id: reply.identity.id,
    name: reply.identity.role === "admin" ? "Operator" : "Visitor",
    role: reply.identity.role === "admin" ? UserRole.ADMIN : UserRole.VISITOR,
  });
  if (reply.conversations) applyConversationList(reply.conversations);
  reply.history?.forEach(state.receiveMessage);
  state.setOnlineVisitors(reply.online || []);
  useConnectionStore.setState({
    status: "Connected",
    ready: true,
    conversationId: reply.identity.conversationId || null,
  });
  useErrorStore.getState().setError(null);
  if (state.selectedVisitorId)
    await selectConversation(state.selectedVisitorId);
}
export function initializeSocket() {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
    autoConnect: false,
    reconnection: true,
  });
  socket.on("connect", () => void join());
  socket.on("disconnect", (reason) => {
    generation++;
    useConnectionStore.setState({
      status: "Disconnected. Reconnecting…",
      ready: false,
    });
    useChatStore.setState({ typingUserIds: new Set() });
    // Server-enforced credential expiry requires a fresh authenticated join.
    if (reason === "io server disconnect" && credentials) socket.connect();
  });
  socket.on("connect_error", () => {
    useConnectionStore.setState({
      status: "Connection failed. Retrying…",
      ready: false,
    });
    useErrorStore
      .getState()
      .setError("Cannot reach the chat server. Retrying…");
  });
  socket.on("error", (error: string) =>
    useErrorStore.getState().setError(error),
  );
  socket.on("receive_message", (m: Message) => {
    const s = useChatStore.getState();
    s.receiveMessage(m);
    if (
      s.role === UserRole.ADMIN &&
      s.selectedVisitorId === m.conversationId
    )
      void persistRead(m.conversationId);
  });
  socket.on("conversations", (list: ConversationListItem[]) =>
    applyConversationList(list),
  );
  socket.on("conversation_read", (p: { conversationId: string; operatorLastReadSequence: number }) => {
    useChatStore.getState().setOperatorLastRead(p.conversationId, p.operatorLastReadSequence);
  });
  socket.on("visitors_online", (ids: string[]) =>
    useChatStore.getState().setOnlineVisitors(ids),
  );
  socket.on(
    "visitor_presence",
    (p: { conversationId: string; online: boolean }) => {
      const s = useChatStore.getState();
      s.updateOnlineStatus(p.conversationId, p.online);
      const notices = s.presenceNotices[p.conversationId] || [];
      const last = notices[notices.length - 1];
      // visitors_online may arrive first and clear the set; trust this event.
      if (!p.online) {
        if (last?.kind !== "left") s.addPresenceNotice(p.conversationId, "left");
      } else if (last?.kind === "left") {
        s.addPresenceNotice(p.conversationId, "returned");
      }
    },
  );
  for (const [event, typing] of [
    ["user_typing", true],
    ["user_stopped_typing", false],
  ] as const)
    socket.on(event, (p: { id: string; conversationId: string }) => {
      const s = useChatStore.getState();
      if (s.role !== UserRole.ADMIN || s.selectedVisitorId === p.conversationId)
        s.setTypingUser(
          s.role === UserRole.ADMIN ? p.conversationId : p.id,
          typing,
        );
    });
  return socket;
}
export const getSocket = () => initializeSocket();
export function connectChat(role: "visitor" | "admin", secret?: string) {
  generation++;
  pending = null;
  const s = getSocket();
  s.disconnect();
  useChatStore.getState().clearChat();
  useChatStore.setState({ user: null, selectedVisitorId: null });
  credentials =
    role === "visitor"
      ? { role, token: getVisitorToken() || undefined }
      : { role, secret };
  useConnectionStore.setState({
    status: "Connecting…",
    ready: false,
    conversationId: null,
  });
  s.connect();
}
/** Clear the visitor token and start a brand-new conversation (same tab). */
export function startNewVisitorChat() {
  clearVisitorToken();
  connectChat("visitor");
}
export function disconnectSocket() {
  generation++;
  pending = null;
  credentials = null;
  socket?.disconnect();
  useConnectionStore.setState({
    status: "Not connected",
    ready: false,
    conversationId: null,
  });
  useChatStore.getState().clearChat();
  useChatStore.setState({ user: null });
}
async function persistRead(id: string) {
  const currentGeneration = generation;
  const reply = await request("select_conversation", { conversationId: id });
  if (currentGeneration !== generation || !reply.ok) return;
  if (typeof reply.operatorLastReadSequence === "number")
    useChatStore
      .getState()
      .setOperatorLastRead(id, reply.operatorLastReadSequence);
}
export async function selectConversation(id: string) {
  const currentGeneration = generation;
  useChatStore.getState().setSelectedVisitorId(id);
  const reply = await request("select_conversation", { conversationId: id });
  if (currentGeneration !== generation) return;
  if (reply.ok) {
    reply.history?.forEach(useChatStore.getState().receiveMessage);
    if (typeof reply.operatorLastReadSequence === "number")
      useChatStore
        .getState()
        .setOperatorLastRead(id, reply.operatorLastReadSequence);
  } else
    useErrorStore.getState().setError(reply.error || "Could not load history");
}
// Keep the same client id for an unacknowledged retry, including after reconnect.
let pending: { key: string; id: string } | null = null;
export async function sendChatMessage(m: Omit<Message, "id" | "timestamp">) {
  if (!useConnectionStore.getState().ready) return false;
  const currentGeneration = generation;
  const key = JSON.stringify([m.conversationId, m.content]);
  if (pending?.key !== key) pending = { key, id: crypto.randomUUID() };
  const reply = await request("send_message", {
    conversationId: m.conversationId,
    content: m.content,
    clientMessageId: pending.id,
  });
  if (currentGeneration !== generation) return false;
  if (!reply.ok) {
    useErrorStore
      .getState()
      .setError(reply.error || "Message failed. Retry sending.");
    return false;
  }
  pending = null;
  if (reply.message) useChatStore.getState().receiveMessage(reply.message);
  return true;
}
