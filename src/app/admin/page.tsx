'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  const handleSelectVisitor = (visitorId: string) => {
    setSelectedVisitor(visitorId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar with conversation list */}
      {/* Mobile: Absolute position, full width, toggled visibility */}
      {/* Desktop: Fixed width, part of flex layout */}
      <div
        className={`absolute md:static inset-y-0 left-0 z-20 w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Conversations</h2>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {/* Close button for mobile sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {visitors.map((visitorId) => {
            const conversation = conversations[visitorId] || [];
            const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
            // Check if the conversation is not selected AND the last message exists AND it's from the visitor
            const hasUnread = 
              selectedVisitor !== visitorId && 
              lastMessage && 
              lastMessage.senderId !== user?.id;

            return (
              <div
                key={visitorId}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedVisitor === visitorId ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => handleSelectVisitor(visitorId)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-white truncate">
                    Visitor {visitorId.substring(0, 8)}
                  </span>
                  {hasUnread && (
                    <span className="ml-2 bg-blue-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                      New
                    </span>
                  )}
                </div>
                {lastMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                    {lastMessage.content}
                  </p>
                )}
              </div>
            );
          })}
          {visitors.length === 0 && (
             <p className="p-4 text-center text-gray-500 dark:text-gray-400">No active conversations.</p>
          )}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with sidebar toggle for mobile */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
             {selectedVisitor ? `Chat with Visitor ${selectedVisitor.substring(0, 8)}` : 'Admin Chat'}
          </h2>
        </div>

        {selectedVisitor ? (
          <>
            {/* Desktop Chat Header */}
            <div className="hidden md:block">
              <ChatHeader
                title={`Chat with Visitor ${selectedVisitor.substring(0, 8)}`}
                status="online" // Placeholder status
              />
            </div>
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] dark:bg-gray-900">
              {selectedConversation.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  // Only pass sender if it's NOT the admin's own message
                  sender={message.senderId !== user?.id ? { id: message.senderId, name: `Visitor ${message.senderId.substring(0,8)}`, role: 'visitor' } : undefined}
                />
              ))}
              {selectedConversation.length === 0 && (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">No messages in this conversation yet.</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <MessageInput
                onSend={(content) =>
                  sendMessage({
                    conversationId: selectedVisitor,
                    senderId: user?.id || 'admin',
                    content,
                  })
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 