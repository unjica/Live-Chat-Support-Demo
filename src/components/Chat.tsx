'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useError } from '@/hooks/useError';
import MessageInput from './MessageInput';
import { create } from 'zustand';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));

export default function Chat() {
  const messages = useChatStore((state: ChatState) => state.messages);
  const { showError } = useError();

  useEffect(() => {
    try {
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to initialize chat');
    }

    return () => {
      try {
        const socket = getSocket();
        socket.disconnect();
      } catch (error) {
        console.error('Error disconnecting socket:', error);
      }
    };
  }, [showError]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message, index: number) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[70%] ${
              message.isUser
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
} 