export type UserRole = 'visitor' | 'agent' | 'admin';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
};

export type Agent = User & {
  role: 'agent';
  department?: string;
  activeConversations: number;
  maxConversations: number;
};

export type Visitor = User & {
  role: 'visitor';
  ipAddress?: string;
  userAgent?: string;
  lastSeen?: number;
}; 