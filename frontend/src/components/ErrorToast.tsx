'use client';

import React, { useEffect, useCallback } from 'react';
import { useErrorStore } from '@/lib/socket';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-0 mx-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white focus:outline-none text-xl"
        aria-label="Close error toast"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </button>
    </div>
  );
};

const ErrorToastWrapper: React.FC = () => {
  const error = useErrorStore((state) => state.error);
  const setError = useErrorStore((state) => state.setError);

  const handleClose = useCallback(() => {
    setError(null);
  }, [setError]);

  if (!error) return null;

  return <ErrorToast message={error} onClose={handleClose} />;
};

export default ErrorToastWrapper;