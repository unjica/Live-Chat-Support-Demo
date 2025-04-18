'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ChatHeader } from '@/components/ChatHeader';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export default function AdminDashboard() {
  const {
    conversations,
    selectedVisitorId,
    setSelectedVisitorId,
    sendMessage,
    user,
    setUser,
  } = useChatStore();

  const [isChatFocused, setIsChatFocused] = useState(true);
  
  // Initialize admin user
  useEffect(() => {
    if (!user) {
      setUser({
        id: 'admin',
        name: 'Support Agent',
        role: 'admin',
        status: 'online',
      });
    }
  }, [user, setUser]);

  // Get unique visitor IDs from conversations
  const visitorIds = Object.keys(conversations);
  const uniqueVisitorIds = [...new Set(visitorIds)];

  const selectedConversation = selectedVisitorId
    ? conversations[selectedVisitorId] || []
    : [];

  const { unreadCount, resetUnreadCount } = useMessageNotifications(
    selectedConversation,
    isChatFocused
  );

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
    if (selectedVisitorId) {
      resetUnreadCount();
    }
  }, [selectedVisitorId, resetUnreadCount]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar with conversation list */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Conversations</h2>
          <DarkModeToggle />
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {uniqueVisitorIds.map((visitorId) => {
            const conversation = conversations[visitorId] || [];
            const unreadMessages = selectedVisitorId !== visitorId ? conversation.length : 0;

            return (
              <div
                key={visitorId}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedVisitorId === visitorId ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setSelectedVisitorId(visitorId)}
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
        {selectedVisitorId ? (
          <>
            <ChatHeader
              title={`Chat with Visitor ${selectedVisitorId}`}
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
                    conversationId: selectedVisitorId,
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