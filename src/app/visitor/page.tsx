'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { ChatWidget } from '@/components/visitor/ChatWidget';
import { DarkModeToggle } from '@/components/DarkModeToggle';

export default function VisitorPage() {
  const { user, setUser } = useChatStore();

  useEffect(() => {
    // Initialize visitor user if not already set
    if (!user) {
      const visitorId = crypto.randomUUID();
      setUser({
        id: visitorId,
        name: `Visitor ${visitorId.slice(0, 4)}`,
        role: 'visitor',
        status: 'online',
      });
    }
  }, [user, setUser]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Our Demo Site
          </h1>
          <DarkModeToggle />
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          This is a demo page showing our live chat support feature. Click the chat button in the bottom-right corner to start a conversation.
        </p>
      </div>
      <ChatWidget />
    </main>
  );
} 