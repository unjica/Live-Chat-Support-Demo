'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useError } from '@/hooks/useError';
import { MessageInput } from '@/components/MessageInput';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/types';

export default function Chat() {
  const messages = useChatStore((state) => state.messages);
  const setUser = useChatStore((state) => state.setUser);
  const user = useChatStore((state) => state.user);
  const { showError } = useError();

  useEffect(() => {
    try {
      // Initialize user
      const visitorId = `visitor_${Math.random().toString(36).substr(2, 9)}`;
      setUser({
        id: visitorId,
        role: 'visitor',
        name: `Visitor ${visitorId}`,
      });

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
  }, [showError, setUser]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg max-w-[70%] ${
              message.senderId === user?.id
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
} 