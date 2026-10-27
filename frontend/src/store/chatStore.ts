import { create } from "zustand";
import { Message, User, UserRole } from "@/types";
import { sendChatMessage } from "@/lib/socket";

export type ConversationMeta = {
  id: string;
  createdAt?: number;
  lastActivityAt?: number;
  operatorLastReadSequence?: number | null;
  lastPreview?: string;
  lastSenderId?: string;
  lastSequence?: number;
};

export type PresenceNotice = {
  id: string;
  conversationId: string;
  kind: "left" | "returned";
  timestamp: number;
};

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  conversationMeta: Record<string, ConversationMeta>;
  presenceNotices: Record<string, PresenceNotice[]>;
  onlineVisitors: Set<string>;
  typingUserIds: Set<string>;
  isChatFocused: boolean;
  selectedVisitorId: string | null;
  role: UserRole | null;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  sendMessage: (message: Omit<Message, "id" | "timestamp">) => Promise<boolean>;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (id: string | null) => void;
  setIsChatFocused: (focused: boolean) => void;
  updateOnlineStatus: (id: string, online: boolean) => void;
  setOnlineVisitors: (ids: string[]) => void;
  setTypingUser: (id: string, typing: boolean) => void;
  upsertConversationMeta: (meta: ConversationMeta) => void;
  setOperatorLastRead: (id: string, sequence: number) => void;
  addPresenceNotice: (conversationId: string, kind: "left" | "returned") => void;
  clearChat: () => void;
}
const merge = (list: Message[], m: Message) =>
  [...list.filter((x) => x.id !== m.id), m].sort(
    (a, b) => (a.sequence || 0) - (b.sequence || 0),
  );
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  conversationMeta: {},
  presenceNotices: {},
  onlineVisitors: new Set(),
  typingUserIds: new Set(),
  isChatFocused: true,
  selectedVisitorId: null,
  role: null,
  setUser: (user) => set({ user, role: user.role }),
  setRole: (role) => set({ role }),
  sendMessage: (message) => sendChatMessage(message),
  receiveMessage: (m) => {
    get().setTypingUser(m.senderId, false);
    if (get().user?.role === UserRole.ADMIN)
      get().setTypingUser(m.conversationId, false);
    if (get().user?.role === UserRole.ADMIN) {
      set((s) => ({
        conversations: {
          ...s.conversations,
          [m.conversationId]: merge(s.conversations[m.conversationId] || [], m),
        },
        conversationMeta: {
          ...s.conversationMeta,
          [m.conversationId]: {
            ...(s.conversationMeta[m.conversationId] || { id: m.conversationId }),
            id: m.conversationId,
            lastActivityAt: m.timestamp,
            lastPreview: m.content,
            lastSenderId: m.senderId,
            lastSequence: m.sequence,
          },
        },
      }));
    } else set((s) => ({ messages: merge(s.messages, m) }));
  },
  setSelectedVisitorId: (selectedVisitorId) =>
    set({ selectedVisitorId, typingUserIds: new Set() }),
  setIsChatFocused: (isChatFocused) => set({ isChatFocused }),
  updateOnlineStatus: (id, online) =>
    set((s) => {
      const ids = new Set(s.onlineVisitors);
      if (online) ids.add(id);
      else ids.delete(id);
      return { onlineVisitors: ids };
    }),
  setOnlineVisitors: (ids) => set({ onlineVisitors: new Set(ids) }),
  setTypingUser: (id, typing) =>
    set((s) => {
      const ids = new Set(s.typingUserIds);
      if (typing) ids.add(id);
      else ids.delete(id);
      return { typingUserIds: ids };
    }),
  upsertConversationMeta: (meta) =>
    set((s) => ({
      conversationMeta: {
        ...s.conversationMeta,
        [meta.id]: { ...(s.conversationMeta[meta.id] || {}), ...meta },
      },
    })),
  setOperatorLastRead: (id, sequence) =>
    set((s) => ({
      conversationMeta: {
        ...s.conversationMeta,
        [id]: {
          ...(s.conversationMeta[id] || { id }),
          id,
          operatorLastReadSequence: Math.max(
            s.conversationMeta[id]?.operatorLastReadSequence ?? 0,
            sequence,
          ),
        },
      },
    })),
  addPresenceNotice: (conversationId, kind) =>
    set((s) => {
      const notice: PresenceNotice = {
        id: `${conversationId}-${kind}-${Date.now()}`,
        conversationId,
        kind,
        timestamp: Date.now(),
      };
      return {
        presenceNotices: {
          ...s.presenceNotices,
          [conversationId]: [
            ...(s.presenceNotices[conversationId] || []),
            notice,
          ].slice(-20),
        },
      };
    }),
  clearChat: () =>
    set({
      messages: [],
      conversations: {},
      conversationMeta: {},
      presenceNotices: {},
      typingUserIds: new Set(),
    }),
}));
