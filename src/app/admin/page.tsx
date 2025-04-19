'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ChatHeader } from '@/components/ChatHeader';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { UserRole, Status } from '@/types';

export default function AdminPage() {
  const { user, setUser, conversations, sendMessage, isChatFocused, setIsChatFocused, onlineVisitors } = useChatStore();
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
        role: UserRole.ADMIN,
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 p-4 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Conversations</h2>
          <DarkModeToggle />
        </div>
      </div>

      {/* Sidebar with conversation list */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-20 w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 border-r border-gray-200/80 dark:border-gray-700/80`}
      >
        <div className="hidden md:block p-4 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Conversations</h2>
            <DarkModeToggle />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">
          {visitors.map((visitorId) => {
            const conversation = conversations[visitorId] || [];
            const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
            const hasUnread = 
              selectedVisitor !== visitorId && 
              lastMessage && 
              lastMessage.senderId !== user?.id;
            const isOnline = onlineVisitors.has(visitorId);

            return (
              <div
                key={visitorId}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedVisitor === visitorId 
                    ? 'bg-blue-50 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => handleSelectVisitor(visitorId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${visitorId}&backgroundColor=b6e3f4`}
                          alt={`Visitor ${visitorId.substring(0, 8)}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Visitor {visitorId.substring(0, 8)}
                        </span>
                        <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                          {isOnline ? 'online' : 'offline'}
                        </span>
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="flex h-6 items-center">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 mt-16 md:mt-0">
        {selectedVisitor ? (
          <>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <ChatHeader
                title={`Chat with Visitor ${selectedVisitor.substring(0, 8)}`}
                status={onlineVisitors.has(selectedVisitor) ? Status.ONLINE : Status.OFFLINE}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] dark:bg-gray-900">
              {selectedConversation.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  sender={message.senderId !== user?.id ? { id: message.senderId, name: `Visitor ${message.senderId.substring(0,8)}`, role: UserRole.VISITOR } : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <MessageInput
                onSend={(content: string) =>
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
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xl text-gray-700 dark:text-gray-300 font-medium mb-2">Welcome to Admin Dashboard</p>
              <p className="text-gray-500 dark:text-gray-400">
                Select a conversation from the sidebar to start chatting with visitors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 