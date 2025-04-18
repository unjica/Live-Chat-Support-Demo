import { Message, User } from '@/types';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

export function MessageBubble({ message, isOwnMessage, sender }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-2 mb-4 ${
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {!isOwnMessage && sender && (
        <div className="flex-shrink-0">
          <Avatar user={sender} size="sm" />
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {!isOwnMessage && sender && (
          <span className="text-xs font-medium text-gray-600 block mb-1">
            {sender.name}
          </span>
        )}
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      {isOwnMessage && sender && (
        <div className="flex-shrink-0">
          <Avatar user={sender} size="sm" />
        </div>
      )}
    </div>
  );
} 