'use client';

import { useState } from 'react';
import { useError } from '@/hooks/useError';
import { useChatStore } from '@/store/chatStore';

interface MessageInputProps {
  onSend?: (content: string) => void;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const { showError } = useError();
  const user = useChatStore((state) => state.user);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      if (onSend) {
        onSend(message.trim());
      } else {
        sendMessage({
          content: message.trim(),
          senderId: user.id,
          conversationId: user.id,
        });
      }
      setMessage('');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="text-black flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </div>
    </form>
  );
} 