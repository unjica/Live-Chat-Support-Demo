import { Status, UserRole } from '@/types';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  status?: Status;
};

export type Visitor = User & {
  role: UserRole.VISITOR;
  ipAddress?: string;
  lastSeen?: number;
};
