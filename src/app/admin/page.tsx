'use client';

import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ChatHeader } from '@/components/ChatHeader';

export default function AdminDashboard() {
  const {
    conversations,
    selectedVisitorId,
    setSelectedVisitorId,
    sendMessage,
    user,
  } = useChatStore();

  // Get unique visitor IDs from conversations
  const visitorIds = Object.keys(conversations).map(
    (convId) => convId.split('_')[0] // Assuming conversationId format is "visitorId_agentId"
  );
  const uniqueVisitorIds = [...new Set(visitorIds)];

  const selectedConversation = selectedVisitorId
    ? conversations[`${selectedVisitorId}_${user?.id}`] || []
    : [];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with conversation list */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Active Conversations</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {uniqueVisitorIds.map((visitorId) => (
            <div
              key={visitorId}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedVisitorId === visitorId ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedVisitorId(visitorId)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Visitor {visitorId}</span>
                <span className="text-sm text-gray-500">
                  {conversations[`${visitorId}_${user?.id}`]?.length || 0} messages
                </span>
              </div>
              {conversations[`${visitorId}_${user?.id}`]?.length > 0 && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {conversations[`${visitorId}_${user?.id}`][
                    conversations[`${visitorId}_${user?.id}`].length - 1
                  ].content}
                </p>
              )}
            </div>
          ))}
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
                />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <MessageInput
                onSend={(content) =>
                  sendMessage({
                    conversationId: `${selectedVisitorId}_${user?.id}`,
                    senderId: user?.id || '',
                    content,
                  })
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
} 