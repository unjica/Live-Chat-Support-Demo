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
    const { user } = get();
    if (!user) return;

    // For visitors: only show messages in their conversation
    if (user.role === 'visitor') {
      if (message.conversationId === user.id) {
        set((state) => ({
          messages: [...state.messages, message]
        }));
      }
    } 
    // For admin: organize messages into conversations
    else {
      set((state) => ({
        conversations: {
          ...state.conversations,
          [message.conversationId]: [
            ...(state.conversations[message.conversationId] || []),
            message,
          ],
        },
      }));
    }
  },

  setSelectedVisitorId: (visitorId) => set({ selectedVisitorId: visitorId }),

  setIsChatFocused: (focused) => set({ isChatFocused: focused }),
})); 