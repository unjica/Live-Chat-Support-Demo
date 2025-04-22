'use client';

import { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/visitor/ChatWindow';
import { useChatStore } from '@/store/chatStore';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { Avatar } from '@/components/visitor/Avatar';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, messages } = useChatStore();
  const { unreadCount, resetUnreadCount } = useMessageNotifications(
    messages,
    isOpen,
    user?.id
  );

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      resetUnreadCount();
    }
  }, [isOpen, resetUnreadCount]);

  return (
    <>
      {/* Chat Window */}
      {isOpen && user && (
        <ChatWindow
          conversationId={user.id}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${
          isOpen ? 'scale-0' : 'scale-100'
        } ${
          unreadCount > 0
            ? 'bg-blue-700 dark:bg-blue-500'
            : 'bg-blue-700 dark:bg-blue-500'
        }`}
      >
        {user ? (
          <div className="relative">
            <Avatar user={user} size="sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Greeting Message Bubble */}
      {!isOpen && unreadCount === 0 && (
        <div className="fixed bottom-24 right-6 z-50 max-w-xs bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out animate-fade-in">
          <p className="text-sm text-gray-800 dark:text-white">
            👋 Hi there! Need help? We're here for you.
          </p>
          <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
        </div>
      )}
    </>
  );
} 