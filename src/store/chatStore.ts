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
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (visitorId: string | null) => void;
  setIsChatFocused: (focused: boolean) => void;
  updateOnlineStatus: (visitorId: string, isOnline: boolean) => void;
  setOnlineVisitors: (visitorIds: string[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  onlineVisitors: new Set(),
  isChatFocused: true,
  selectedVisitorId: null,

  setUser: (user) => {
    set({ user });
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

  sendMessage: (messageData) => {
    const { user } = get();
    if (!user) return;

    const message = {
      id: crypto.randomUUID(),
      ...messageData,
      timestamp: Date.now(),
    };

    const socket = getSocket();
    socket.emit('send_message', message);
  },

  receiveMessage: (message) => {
    const { user } = get();
    if (!user) return;

    if (user.role === 'admin') {
      set((state) => ({
        conversations: {
          ...state.conversations,
          [message.conversationId]: [
            ...(state.conversations[message.conversationId] || []),
            message,
          ],
        },
      }));
    } else if (message.conversationId === user.id) {
      set((state) => ({
        messages: [...state.messages, message]
      }));
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
})); 