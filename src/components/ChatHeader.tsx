import { Status } from '@/types';

interface ChatHeaderProps {
  title: string;
  status: Status;
}

export function ChatHeader({ title, status }: ChatHeaderProps) {
  const statusColors = {
    [Status.ONLINE]: 'bg-green-500',
    [Status.OFFLINE]: 'bg-gray-500',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{status}</span>
        <div
          className={`w-2 h-2 rounded-full ${statusColors[status]}`}
          title={status}
        />
      </div>
    </div>
  );
} 