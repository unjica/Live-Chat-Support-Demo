import { Message, User } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

export function MessageBubble({ message, isOwnMessage, sender }: MessageBubbleProps) {
  return (
    <div className={`flex gap-1 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative flex flex-col gap-1 p-2 rounded-2xl max-w-[70%] ${
          isOwnMessage
            ? 'ml-auto bg-blue-200 dark:bg-blue-900 rounded-tr-none'
            : 'bg-white dark:bg-gray-800 rounded-tl-none'
        }`}
      >
        {!isOwnMessage && sender && (
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {sender.name}
          </span>
        )}
        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="flex items-center justify-end gap-1 text-[0.65rem] text-gray-500 dark:text-gray-400">
          <span className="text-[0.6875rem] text-[#667781] dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit',
              minute: '2-digit',
              hour12: true 
            })}
          </span>
          {isOwnMessage && message.status && (
            <span className="flex items-center">
              {message.status === 'read' ? (
                <svg className="w-3 h-3 text-blue-500 dark:text-blue-400" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.3 4.3L6 9.6l-2.3-2.3-1.4 1.4L6 12.4l6.7-6.7z"/>
                </svg>
              ) : message.status === 'delivered' ? (
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.3 4.3L6 9.6l-2.3-2.3-1.4 1.4L6 12.4l6.7-6.7z"/>
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm0 12A5.5 5.5 0 1 1 13.5 8 5.51 5.51 0 0 1 8 13.5z"/>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 