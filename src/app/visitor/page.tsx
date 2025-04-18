export default function VisitorChat() {
  return (
    <main className="min-h-screen p-4">
      <div className="chat-container max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Live Chat Support</h2>
        </div>
        <div className="chat-messages p-4 h-[400px] overflow-y-auto">
          {/* Chat messages will be rendered here */}
        </div>
      </div>
    </main>
  );
} 