import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '../shared/MessageBubble';
import { MessageInput } from '../shared/MessageInput';

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
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold">Live Chat Support</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {conversationMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput conversationId={conversationId} />
    </div>
  );
} 