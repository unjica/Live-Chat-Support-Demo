'use client';

import React from 'react';
import ErrorToast from './ErrorToast';
import { useErrorStore } from '@/lib/socket';

export default function ErrorToastWrapper() {
  const error = useErrorStore((state) => state.error);
  const setError = useErrorStore((state) => state.setError);

  if (!error) return null;

  return (
    <ErrorToast
      message={error}
      onClose={() => setError(null)}
    />
  );
} 