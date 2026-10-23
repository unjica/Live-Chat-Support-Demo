import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useChatStore } from "@/store/chatStore";
import { Message, UserRole } from "@/types";
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
type Reply = {
  ok: boolean;
  error?: string;
  code?: string;
  identity?: { id: string; role: "visitor" | "admin"; conversationId?: string };
  token?: string;
  history?: Message[];
  conversations?: { id: string }[];
  online?: string[];
  message?: Message;
};
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
    sessionStorage.removeItem("chat-token");
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
    sessionStorage.setItem("chat-token", reply.token);
    credentials.token = reply.token;
  }
  const state = useChatStore.getState();
  state.setUser({
    id: reply.identity.id,
    name: reply.identity.role === "admin" ? "Operator" : "Visitor",
    role: reply.identity.role === "admin" ? UserRole.ADMIN : UserRole.VISITOR,
  });
  // Merge by server id to retain events received while history was being fetched.
  useChatStore.setState((s) => ({
    conversations: {
      ...Object.fromEntries((reply.conversations || []).map((c) => [c.id, []])),
      ...s.conversations,
    },
  }));
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
  socket.on("connect_error", () =>
    useConnectionStore.setState({
      status: "Connection failed. Retrying…",
      ready: false,
    }),
  );
  socket.on("error", (error: string) =>
    useErrorStore.getState().setError(error),
  );
  socket.on("receive_message", (m: Message) =>
    useChatStore.getState().receiveMessage(m),
  );
  socket.on("conversations", (list: { id: string }[]) =>
    useChatStore.setState((s) => ({
      conversations: {
        ...Object.fromEntries(list.map((c) => [c.id, []])),
        ...s.conversations,
      },
    })),
  );
  socket.on("visitors_online", (ids: string[]) =>
    useChatStore.getState().setOnlineVisitors(ids),
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
      ? { role, token: sessionStorage.getItem("chat-token") || undefined }
      : { role, secret };
  useConnectionStore.setState({
    status: "Connecting…",
    ready: false,
    conversationId: null,
  });
  s.connect();
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
export async function selectConversation(id: string) {
  const currentGeneration = generation;
  useChatStore.getState().setSelectedVisitorId(id);
  const reply = await request("select_conversation", { conversationId: id });
  if (currentGeneration !== generation) return;
  if (reply.ok) reply.history?.forEach(useChatStore.getState().receiveMessage);
  else
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
