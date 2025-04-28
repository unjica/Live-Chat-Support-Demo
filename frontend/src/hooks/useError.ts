'use client';

import { useErrorStore } from '@/lib/socket';

export const useError = () => {
  const setError = useErrorStore((state) => state.setError);

  const showError = (error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setError(errorMessage);
  };

  return { showError };
}; 