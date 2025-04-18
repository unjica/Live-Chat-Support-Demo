'use client';

import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ChatHeader } from '@/components/ChatHeader';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { UserRole } from '@/types';

export default function AdminPage() {
  const { user, setUser, conversations, sendMessage, isChatFocused, setIsChatFocused } = useChatStore();
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  
  // Get unique visitor IDs from conversations
  const visitors = useMemo(() => {
    return Array.from(new Set(Object.keys(conversations)));
  }, [conversations]);

  // Get messages for selected visitor
  const selectedConversation = useMemo(() => {
    return selectedVisitor ? conversations[selectedVisitor] || [] : [];
  }, [selectedVisitor, conversations]);

  // Get all messages for notifications
  const allMessages = useMemo(() => {
    return Object.values(conversations).flat();
  }, [conversations]);

  const { unreadCount, resetUnreadCount } = useMessageNotifications(
    allMessages,
    isChatFocused,
    user?.id
  );

  // Initialize admin user
  useEffect(() => {
    if (!user) {
      const adminUser = {
        id: 'admin',
        name: 'Admin',
        role: 'admin' as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4`,
      };
      setUser(adminUser);
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
  }, [setIsChatFocused]);

  useEffect(() => {
    if (selectedVisitor) {
      resetUnreadCount();
    }
  }, [selectedVisitor, resetUnreadCount]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar with conversation list */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Conversations</h2>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {visitors.map((visitorId) => {
            const conversation = conversations[visitorId] || [];
            const unreadMessages = selectedVisitor !== visitorId ? conversation.length : 0;

            return (
              <div
                key={visitorId}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedVisitor === visitorId ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setSelectedVisitor(visitorId)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-white">
                    Visitor {visitorId.slice(0, 4)}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadMessages > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {unreadMessages}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {conversation.length} messages
                    </span>
                  </div>
                </div>
                {conversation.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                    {conversation[conversation.length - 1].content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedVisitor ? (
          <>
            <ChatHeader
              title={`Chat with Visitor ${selectedVisitor}`}
              status="online"
            />
            <div className="flex-1 overflow-y-auto p-4">
              {selectedConversation.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  sender={message.senderId === user?.id ? user : undefined}
                />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <MessageInput
                onSend={(content) =>
                  sendMessage({
                    conversationId: selectedVisitor,
                    senderId: user?.id || '',
                    content,
                  })
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 