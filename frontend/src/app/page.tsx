import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo.png"
              alt="Live Chat Support Logo"
              width={120}
              height={120}
              className="rounded-lg shadow-lg bg-blue-500"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Live Chat Support Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Experience real-time chat support with our WhatsApp-style interface.
            Choose your role below to get started.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Visitor Card */}
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform transition hover:scale-105">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
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
                className="mt-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Enter as Visitor
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Admin Card */}
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform transition hover:scale-105">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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
                className="mt-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
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
