'use client';

import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useError } from '@/hooks/useError';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const { showError } = useError();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const socket = getSocket();
      if (!socket.connected) {
        throw new Error('Not connected to chat server. Please try again.');
      }

      socket.emit('send_message', { text: message });
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
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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