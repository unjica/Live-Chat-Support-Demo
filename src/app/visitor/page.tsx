import { ChatWidget } from '@/components/visitor/ChatWidget';

export default function VisitorChat() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome to our Support Page</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Click the chat button in the bottom right corner to start a conversation with our support team.
        </p>
      </div>
      <ChatWidget />
    </main>
  );
} 