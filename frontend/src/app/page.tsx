import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Live Chat Support Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Experience real-time chat support with our WhatsApp-style interface.
            Choose your role below to get started.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Visitor Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform transition hover:scale-105">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Visitor Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start a conversation with our support team using our intuitive chat interface.
              </p>
              <Link 
                href="/visitor"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Enter as Visitor
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Admin Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform transition hover:scale-105">
              <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Access the admin dashboard to manage conversations and support visitors.
              </p>
              <Link 
                href="/admin"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                Enter as Admin
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              About This Demo
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              This is a demonstration of a real-time chat support system built with Next.js, Socket.IO, and TypeScript.
              Experience both sides of the conversation by opening the visitor chat in one window and the admin dashboard in another.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
