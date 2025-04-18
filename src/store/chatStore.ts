import { create } from 'zustand';
import { Message, User } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  setUser: (user: User) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  receiveMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  user: null,
  conversations: {},

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

    set((state) => ({
      messages: [...state.messages, newMessage],
      conversations: {
        ...state.conversations,
        [message.conversationId]: [
          ...(state.conversations[message.conversationId] || []),
          newMessage,
        ],
      },
    }));

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
})); 