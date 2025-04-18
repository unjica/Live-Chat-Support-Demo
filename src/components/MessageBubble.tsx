import { Message, User } from '@/types';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

export function MessageBubble({ message, isOwnMessage, sender }: MessageBubbleProps) {
  return (
    <div className={`flex gap-1 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[65%] px-2 py-1.5 rounded-lg ${
          isOwnMessage
            ? 'bg-[#d9fdd3] dark:bg-green-700 text-[#111b21] dark:text-white rounded-tr-none'
            : 'bg-white dark:bg-gray-700 text-[#111b21] dark:text-white rounded-tl-none'
        }`}
      >
        {!isOwnMessage && sender && (
          <span className="text-xs font-medium text-[#008069] dark:text-green-400 block mb-0.5">
            {sender.name}
          </span>
        )}
        <p className="text-[0.9375rem] leading-[1.35rem] break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 -mb-1 mt-1">
          <span className="text-[0.6875rem] text-[#667781] dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit',
              minute: '2-digit',
              hour12: true 
            })}
          </span>
          {isOwnMessage && message.status && (
            <span className="text-[#8696a0] dark:text-gray-400">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '•'}
            </span>
          )}
        </div>

        {/* Message tail */}
        <div
          className={`absolute top-0 ${
            isOwnMessage ? '-right-2' : '-left-2'
          } w-2 h-2 overflow-hidden`}
        >
          <div
            className={`w-3 h-3 transform rotate-45 ${
              isOwnMessage
                ? 'bg-[#d9fdd3] dark:bg-green-700 -translate-x-1/2'
                : 'bg-white dark:bg-gray-700 translate-x-1/2'
            }`}
          />
        </div>
      </div>
    </div>
  );
} 