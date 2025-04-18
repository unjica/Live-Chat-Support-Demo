'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ChatHeader } from '@/components/ChatHeader';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export default function VisitorChat() {
  const {
    messages,
    user,
    sendMessage,
    setUser,
  } = useChatStore();

  const [isChatFocused, setIsChatFocused] = useState(true);
  const { unreadCount, resetUnreadCount } = useMessageNotifications(
    messages,
    isChatFocused,
    user?.id
  );

  useEffect(() => {
    // Initialize visitor user
    if (!user) {
      const visitorId = crypto.randomUUID();
      setUser({
        id: visitorId,
        name: `Visitor ${visitorId.slice(0, 4)}`,
        role: 'visitor',
        status: 'online',
      });
    }
  }, [user, setUser]);

  useEffect(() => {
    const handleFocus = () => setIsChatFocused(true);
    const handleBlur = () => setIsChatFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    resetUnreadCount();
  }, [messages, resetUnreadCount]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Chat area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Live Support Chat</h2>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>
        
        {user ? (
          <>
            <ChatHeader
              title="Chat with Support"
              status="online"
            />
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user.id}
                  sender={message.senderId === user.id ? user : undefined}
                />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <MessageInput
                onSend={(content) =>
                  sendMessage({
                    conversationId: user.id,
                    senderId: user.id,
                    content,
                  })
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Connecting to chat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 