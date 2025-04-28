import { User, Status } from '@/types';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ user, size = 'md' }: AvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className={`rounded-full ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-600 ${sizeClasses[size]}`}
        >
          <span>{getInitials(user.name)}</span>
        </div>
      )}
      {user.status && (
        <div
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            user.status === Status.ONLINE
              ? 'bg-green-500'
              : 'bg-gray-500'
          }`}
        />
      )}
    </div>
  );
} 