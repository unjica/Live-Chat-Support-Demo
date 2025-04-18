import { create } from 'zustand';

export type Message = {
  id: string;
  content: string;
  sender: 'visitor' | 'agent';
  timestamp: Date;
};

type ChatState = {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setIsConnected: (status: boolean) => void;
  setIsTyping: (status: boolean) => void;
  clearMessages: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isConnected: false,
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  setIsConnected: (status) => set({ isConnected: status }),
  setIsTyping: (status) => set({ isTyping: status }),
  clearMessages: () => set({ messages: [] }),
})); 