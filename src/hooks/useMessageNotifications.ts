'use client';

import { useEffect, useState, useCallback } from 'react';
import { Message } from '@/types';
import { useSound } from '@/hooks/useSound';

export function useMessageNotifications(
  messages: Message[],
  isChatFocused: boolean,
  userId?: string
) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { playSound, hasInteracted } = useSound();

  useEffect(() => {
    if (!userId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const isNewMessage = lastMessage.senderId !== userId;
    const shouldNotify = isNewMessage && !isChatFocused;

    if (shouldNotify) {
      setUnreadCount(prev => prev + 1);
      if (hasInteracted) {
        playSound();
      }
    }
  }, [messages, isChatFocused, userId, playSound, hasInteracted]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    resetUnreadCount
  };
} 