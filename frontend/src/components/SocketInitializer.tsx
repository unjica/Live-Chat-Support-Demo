'use client';

import { useEffect } from 'react';
import { initializeSocket } from '@/lib/socket';

/** Mount-only helper that starts the shared Socket.IO client for the whole app shell. */
export function SocketInitializer() {
  useEffect(() => {
    initializeSocket();
  }, []);

  return null; // This component doesn't render anything
} 