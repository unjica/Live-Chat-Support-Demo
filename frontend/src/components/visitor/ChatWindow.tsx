import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/shared/MessageBubble';
import { MessageInput } from '@/components/shared/MessageInput';
import { chatConfig } from '@/config/chat';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
}

export function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
  const { messages, user } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = messages.filter(
    (msg) => msg.conversationId === conversationId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  return (
    <div className="fixed bottom-0 right-0 w-full h-[calc(100vh-4rem)] sm:w-[380px] sm:h-[600px] sm:bottom-6 sm:right-6 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-blue-500 dark:bg-gray-800">
        <div className="flex items-center flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="ml-3 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{chatConfig.defaultAgentName}</h3>
            <p className="text-xs text-gray-300 dark:text-gray-400">online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#ffffff1a] text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat area - hidden on mobile when collapsed */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-600 transition-all duration-300 ease-in-out max-h-[calc(100vh-12rem)]"
      >
        {conversationMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === user?.id}
            sender={message.senderId === user?.id ? user : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - hidden on mobile when collapsed */}
      <div 
        className="bg-[#f0f2f5] dark:bg-gray-800 p-3 transition-all duration-300 ease-in-out max-h-20"
      >
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  );
} 