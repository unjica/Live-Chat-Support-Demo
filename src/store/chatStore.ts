import { create } from 'zustand';
import { Message, User } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  onlineVisitors: Set<string>;
  isChatFocused: boolean;
  selectedVisitorId: string | null;
  role: 'admin' | 'visitor' | null;
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (visitorId: string | null) => void;
  setIsChatFocused: (focused: boolean) => void;
  updateOnlineStatus: (visitorId: string, isOnline: boolean) => void;
  setOnlineVisitors: (visitorIds: string[]) => void;
  setRole: (role: 'admin' | 'visitor') => void;
  clearChat: () => void;
}

// Storage keys
const STORAGE_KEYS = {
  admin: 'admin-chat',
  visitor: 'visitor-chat',
} as const;

type StorageRole = keyof typeof STORAGE_KEYS;

// Utility function to safely access storage
const getStorage = (type: 'local' | 'session') => {
  if (typeof window === 'undefined') return null;
  return type === 'local' ? localStorage : sessionStorage;
};

// Utility function to safely parse storage data
const parseStorageData = (data: string | null): Message[] => {
  try {
    return data ? JSON.parse(data).filter(Boolean) : [];
  } catch {
    return [];
  }
};

// Utility function to safely stringify data
const stringifyData = (data: Message[]): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return '[]';
  }
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  onlineVisitors: new Set(),
  isChatFocused: true,
  selectedVisitorId: null,
  role: null,

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
    socket.on('visitor_online', (visitorId: string) => {
      get().updateOnlineStatus(visitorId, true);
    });

    socket.on('visitor_offline', (visitorId: string) => {
      get().updateOnlineStatus(visitorId, false);
    });

    socket.on('visitors_online', (visitorIds: string[]) => {
      get().setOnlineVisitors(visitorIds);
    });
  },

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

  receiveMessage: (message) => {
    const { user } = get();
    if (!user) return;

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

  updateOnlineStatus: (visitorId, isOnline) => {
    set((state) => {
      const newOnlineVisitors = new Set(state.onlineVisitors);
      if (isOnline) {
        newOnlineVisitors.add(visitorId);
      } else {
        newOnlineVisitors.delete(visitorId);
      }
      return { onlineVisitors: newOnlineVisitors };
    });
  },

  setOnlineVisitors: (visitorIds) => {
    set({ onlineVisitors: new Set(visitorIds) });
  },

  setSelectedVisitorId: (visitorId) => set({ selectedVisitorId: visitorId }),

  setIsChatFocused: (focused) => set({ isChatFocused: focused }),

  clearChat: () => {
    const { role } = get();
    if (!role) return;

    set({ messages: [] });
    
    // Clear storage
    const storage = role === 'admin' ? getStorage('local') : getStorage('session');
    const storageKey = STORAGE_KEYS[role];
    
    if (storage && storageKey) {
      storage.removeItem(storageKey);
    }
  },
})); 