interface ChatHeaderProps {
  title: string;
  status: 'online' | 'offline' | 'away';
}

export function ChatHeader({ title, status }: ChatHeaderProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 capitalize">{status}</span>
        <div
          className={`w-2 h-2 rounded-full ${statusColors[status]}`}
          title={status}
        />
      </div>
    </div>
  );
} 