'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';

export function useMessageNotifications(
  messages: Message[],
  isChatFocused: boolean
) {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3');
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    
    // Skip if this is the first message or if we've already processed this message
    if (!lastMessageId.current || lastMessageId.current !== latestMessage.id) {
      lastMessageId.current = latestMessage.id;
      
      if (!isChatFocused) {
        setUnreadCount((prev) => prev + 1);
        audioRef.current?.play().catch(() => {
          // Handle autoplay restrictions
          console.log('Audio playback failed');
        });
      }
    }
  }, [messages, isChatFocused]);

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  return { unreadCount, resetUnreadCount };
} 