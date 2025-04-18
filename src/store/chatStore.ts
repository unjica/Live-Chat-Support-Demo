import { create } from 'zustand';
import { Message, User } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  selectedVisitorId: string | null;
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
  setSelectedVisitorId: (visitorId: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},
  selectedVisitorId: null,

  setUser: (user) => {
    set({ user });
    const socket = getSocket();
    socket.emit('user_join', user);
  },

  sendMessage: (message) => {
    const { user } = get();
    if (!user) return;

    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const socket = getSocket();
    socket.emit('send_message', newMessage);
  },

  receiveMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      conversations: {
        ...state.conversations,
        [message.conversationId]: [
          ...(state.conversations[message.conversationId] || []),
          message,
        ],
      },
    }));
  },

  setSelectedVisitorId: (visitorId) => set({ selectedVisitorId: visitorId }),
})); 