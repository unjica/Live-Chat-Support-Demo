import { create } from 'zustand';
import { Message, User } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  isChatFocused: boolean;
  selectedVisitorId: string | null;
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (visitorId: string | null) => void;
  setIsChatFocused: (focused: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  isChatFocused: true,
  selectedVisitorId: null,

  setUser: (user) => {
    set({ user });
    const socket = getSocket();
    socket.emit('user_join', user);
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

  setSelectedVisitorId: (visitorId) => set({ selectedVisitorId: visitorId }),

  setIsChatFocused: (focused) => set({ isChatFocused: focused }),
})); 