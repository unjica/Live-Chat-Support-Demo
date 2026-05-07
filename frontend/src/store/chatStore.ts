/**
 * Global chat state: messages, conversations, presence, typing, and browser persistence.
 *
 * Visitor history uses `sessionStorage`; admin history uses `localStorage`, keyed per role.
 */
import { create } from 'zustand';
import { Message, User, UserRole } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  onlineVisitors: Set<string>;
  typingUserIds: Set<string>;
  isChatFocused: boolean;
  selectedVisitorId: string | null;
  role: UserRole | null;
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (visitorId: string | null) => void;
  setIsChatFocused: (focused: boolean) => void;
  updateOnlineStatus: (visitorId: string, isOnline: boolean) => void;
  setOnlineVisitors: (visitorIds: string[]) => void;
  setRole: (role: UserRole) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  clearChat: () => void;
}

// Storage keys
const STORAGE_KEYS = {
  admin: 'admin-chat',
  visitor: 'visitor-chat',
} as const;

type StorageRole = keyof typeof STORAGE_KEYS;

/**
 * Resolve `localStorage` or `sessionStorage` in the browser; no-op on the server.
 *
 * @param type - Which Web Storage API to use.
 * @returns Storage instance or `null` during SSR / unavailable APIs.
 */
const getStorage = (type: 'local' | 'session') => {
  if (typeof window === 'undefined') return null;
  return type === 'local' ? localStorage : sessionStorage;
};

/**
 * Parse JSON chat history from storage, returning an empty list on invalid input.
 *
 * @param data - Raw JSON string or `null`.
 */
const parseStorageData = (data: string | null): Message[] => {
  try {
    return data ? JSON.parse(data).filter(Boolean) : [];
  } catch {
    return [];
  }
};

/**
 * Serialize messages for persistence; falls back to `"[]"` if serialization fails.
 *
 * @param data - Messages to store.
 */
const stringifyData = (data: Message[]): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return '[]';
  }
};

/** Zustand hook exposing chat actions and derived state for visitor and admin UIs. */
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  onlineVisitors: new Set(),
  typingUserIds: new Set(),
  isChatFocused: true,
  selectedVisitorId: null,
  role: null,

  /** Set current user, hydrate messages from Web Storage, join the socket room, and wire presence listeners. */
  setUser: (user) => {
    set({ user });
    
    // Set role and load stored messages
    const role = user.role as StorageRole;
    const storage = role === 'admin' ? getStorage('local') : getStorage('session');
    const storageKey = STORAGE_KEYS[role];
    
    if (storage && storageKey) {
      const storedData = storage.getItem(storageKey);
      const storedMessages = parseStorageData(storedData);
      
      if (role === 'admin') {
        // For admin, organize messages by conversation
        const conversations = storedMessages.reduce((acc, message) => {
          const conversationId = message.conversationId;
          if (!acc[conversationId]) {
            acc[conversationId] = [];
          }
          acc[conversationId].push(message);
          return acc;
        }, {} as Record<string, Message[]>);
        
        set((state) => ({ ...state, conversations, messages: [] }));
      } else {
        // For visitor, just set messages
        set((state) => ({ ...state, messages: storedMessages, conversations: {} }));
      }
    }

    const socket = getSocket();
    socket.emit('user_join', user);

    // Set up online status listeners
    /** Apply visitor connect presence from the socket layer. */
    socket.on('visitor_online', (visitorId: string) => {
      get().updateOnlineStatus(visitorId, true);
    });

    /** Apply visitor disconnect presence from the socket layer. */
    socket.on('visitor_offline', (visitorId: string) => {
      get().updateOnlineStatus(visitorId, false);
    });

    /** Seed the admin UI with all visitor ids currently connected on the server. */
    socket.on('visitors_online', (visitorIds: string[]) => {
      get().setOnlineVisitors(visitorIds);
    });
  },

  /** Hydrate state from storage for a role without emitting `user_join` (used by role-only flows). */
  setRole: (role) => {
    const storage = role === 'admin' ? getStorage('local') : getStorage('session');
    const storageKey = STORAGE_KEYS[role as StorageRole];
    
    if (storage && storageKey) {
      const storedData = storage.getItem(storageKey);
      const storedMessages = parseStorageData(storedData);
      
      if (role === 'admin') {
        // For admin, organize messages by conversation
        const conversations = storedMessages.reduce((acc, message) => {
          const conversationId = message.conversationId;
          if (!acc[conversationId]) {
            acc[conversationId] = [];
          }
          acc[conversationId].push(message);
          return acc;
        }, {} as Record<string, Message[]>);
        
        set({ role, conversations, messages: [] });
      } else {
        // For visitor, just set messages
        set({ role, messages: storedMessages, conversations: {} });
      }
    } else {
      set({ role, messages: [], conversations: {} });
    }
  },

  /** Build a client message id/timestamp and emit `send_message` over Socket.IO. */
  sendMessage: (messageData) => {
    const { user } = get();
    if (!user) return;

    const message = {
      id: crypto.randomUUID(),
      ...messageData,
      timestamp: Date.now(),
    };

    // Emit message through socket
    const socket = getSocket();
    socket.emit('send_message', message);
  },

  /** Append a server-formatted message, persist to storage, and clear typing for the sender. */
  receiveMessage: (message) => {
    const { user } = get();
    if (!user) return;

    get().setTypingUser(message.senderId, false);

    if (user.role === 'admin') {
      set((state) => {
        const newConversations = {
          ...state.conversations,
          [message.conversationId]: [
            ...(state.conversations[message.conversationId] || []),
            message,
          ],
        };

        // Persist to storage for admin
        const storage = getStorage('local');
        if (storage) {
          const allMessages = Object.values(newConversations).flat();
          storage.setItem(STORAGE_KEYS.admin, stringifyData(allMessages));
        }

        return { conversations: newConversations };
      });
    } else {
      set((state) => {
        const newMessages = [...state.messages, message];
        
        // Persist to storage for visitor
        const storage = getStorage('session');
        if (storage) {
          storage.setItem(STORAGE_KEYS.visitor, stringifyData(newMessages));
        }

        return { messages: newMessages };
      });
    }
  },

  /** Add or remove a visitor id from the live `onlineVisitors` set. When going offline, clear stale typing for that id (no `user_stopped_typing` on disconnect). */
  updateOnlineStatus: (visitorId, isOnline) => {
    set((state) => {
      const newOnlineVisitors = new Set(state.onlineVisitors);
      if (isOnline) {
        newOnlineVisitors.add(visitorId);
      } else {
        newOnlineVisitors.delete(visitorId);
      }
      const newTypingUserIds = new Set(state.typingUserIds);
      if (!isOnline) {
        newTypingUserIds.delete(visitorId);
      }
      return { onlineVisitors: newOnlineVisitors, typingUserIds: newTypingUserIds };
    });
  },

  /** Replace online visitors with the authoritative list from the server (admin bootstrap). */
  setOnlineVisitors: (visitorIds) => {
    set({ onlineVisitors: new Set(visitorIds) });
  },

  /** Persist which visitor thread the admin UI is focused on. */
  setSelectedVisitorId: (visitorId) => set({ selectedVisitorId: visitorId }),

  /** Track browser window focus for notification heuristics on the admin side. */
  setIsChatFocused: (focused) => set({ isChatFocused: focused }),

  /** Merge typing presence for a user id (support team or a visitor). */
  setTypingUser: (userId, isTyping) => {
    set((state) => {
      const next = new Set(state.typingUserIds);
      if (isTyping) next.add(userId);
      else next.delete(userId);
      return { typingUserIds: next };
    });
  },

  /** Wipe in-memory chat data and the matching Web Storage bucket for the active role. */
  clearChat: () => {
    const { role } = get();
    if (!role) return;

    set({
      messages: [],
      ...(role === 'admin' ? { conversations: {} } : {}),
      typingUserIds: new Set(),
    });
    
    // Clear storage
    const storage = role === 'admin' ? getStorage('local') : getStorage('session');
    const storageKey = STORAGE_KEYS[role];
    
    if (storage && storageKey) {
      storage.removeItem(storageKey);
    }
  },
})); 