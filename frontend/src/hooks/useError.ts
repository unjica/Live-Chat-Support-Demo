'use client';

import { useErrorStore } from '@/lib/socket';

/**
 * Bridge to the global error store for imperative `showError` calls from components.
 *
 * @returns `{ showError }` — `showError` accepts an `Error` or string message.
 */
export const useError = () => {
  const setError = useErrorStore((state) => state.setError);

  const showError = (error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setError(errorMessage);
  };

  return { showError };
}; 