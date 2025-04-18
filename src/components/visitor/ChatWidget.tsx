'use client';

import { useState } from 'react';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '@/store/chatStore';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { setUser } = useChatStore();

  // Generate a unique conversation ID for this visitor
  const conversationId = 'visitor-' + crypto.randomUUID();

  // Set up visitor user on component mount
  useState(() => {
    setUser({
      id: 'visitor-' + crypto.randomUUID(),
      name: 'Visitor',
      role: 'visitor',
    });
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {isOpen && (
        <ChatWindow
          conversationId={conversationId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 