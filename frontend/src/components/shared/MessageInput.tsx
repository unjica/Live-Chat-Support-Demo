'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { getSocket } from '@/lib/socket';

interface MessageInputProps {
  conversationId: string;
}

const TYPING_IDLE_MS = 2000;

/**
 * Controlled chat composer: sends messages and emits typing start/stop over Socket.IO.
 *
 * @param conversationId - Thread key (visitor id for admin replies; visitor’s own id in widget).
 */
export function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const { sendMessage, user } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  /** Conversation id for the in-flight typing burst (survives prop changes until stop). */
  const typingForConversationRef = useRef<string | null>(null);

  /** Cancel pending idle timer and emit `typing_stop` for the room that received `typing_start`. */
  const emitTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (isTypingRef.current) {
      const conv = typingForConversationRef.current;
      if (conv) {
        getSocket().emit('typing_stop', { conversationId: conv });
      }
      isTypingRef.current = false;
      typingForConversationRef.current = null;
    }
  }, []);

  /** On unmount or when `conversationId` changes, stop typing for the previous thread. */
  useEffect(() => {
    return () => {
      emitTypingStop();
    };
  }, [conversationId, emitTypingStop]);

  /** (Re)arm the idle window after which `typing_stop` is emitted automatically. */
  const scheduleTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      typingStopTimerRef.current = null;
      emitTypingStop();
    }, TYPING_IDLE_MS);
  }, [emitTypingStop]);

  /** Validate, send the trimmed message, reset local state, and end typing. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    emitTypingStop();

    sendMessage({
      conversationId,
      senderId: user.id,
      content: message.trim(),
    });

    setMessage('');
    // Keep focus on input after sending
    inputRef.current?.focus();
  };

  /** Submit on Enter while ignoring Shift+Enter (reserved for future multiline). */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /** Keep local text in sync and drive debounced typing start/stop emissions. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!user) return;

    if (value.trim()) {
      if (!isTypingRef.current) {
        typingForConversationRef.current = conversationId;
        getSocket().emit('typing_start', { conversationId });
        isTypingRef.current = true;
      }
      scheduleTypingStop();
    } else {
      emitTypingStop();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <button
        type="button"
        className="p-2 text-[#54656f] dark:text-gray-400 hover:text-[#008069] dark:hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-700 focus:outline-none text-[#111b21] dark:text-white placeholder-[#667781] dark:placeholder-gray-400 text-base"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="true"
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim()}
        className="p-2 text-[#54656f] dark:text-gray-400 hover:text-[#008069] dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {message.trim() ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </form>
  );
} 