'use client';

import { useEffect, useState, useCallback } from 'react';
import { Message, UserRole } from '@/types';
import { useSound } from '@/hooks/useSound';
import { useChatStore } from '@/store/chatStore';

/**
 * Track unread message count and optionally play a sound when new messages arrive.
 *
 * @param messages - Current thread messages (flat list or derived).
 * @param isChatFocused - When false (admin), still notifies on inbound messages.
 * @param userId - Current user id; used to detect messages from others.
 * @returns `{ unreadCount, resetUnreadCount }`.
 */
export function useMessageNotifications(
  messages: Message[],
  isChatFocused: boolean,
  userId?: string
) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { playSound, hasInteracted } = useSound();
  const { user } = useChatStore();

  useEffect(() => {
    if (!userId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const isNewMessage = lastMessage.senderId !== userId;
    const isVisitor = user?.role === UserRole.VISITOR;
    
    // For visitors: play sound on any admin message
    // For admin: play sound only when chat is not focused
    const shouldNotify = isNewMessage && (!isChatFocused || isVisitor);

    if (shouldNotify) {
      setUnreadCount(prev => prev + 1);
      if (hasInteracted) {
        playSound();
      }
    }
  }, [messages, isChatFocused, userId, playSound, hasInteracted, user?.role]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    resetUnreadCount
  };
} 