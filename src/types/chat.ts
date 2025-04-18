export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
};

export type Conversation = {
  id: string;
  visitorId: string;
  agentId?: string;
  messages: Message[];
  status: 'active' | 'waiting' | 'ended';
  startedAt: number;
  endedAt?: number;
};

export type ChatStatus = 'online' | 'offline' | 'away' | 'busy'; 