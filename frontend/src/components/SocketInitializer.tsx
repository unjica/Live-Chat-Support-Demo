'use client';

import { useEffect } from 'react';
import { initializeSocket } from '@/lib/socket';

export function SocketInitializer() {
  useEffect(() => {
    initializeSocket();
  }, []);

  return null; // This component doesn't render anything
} 