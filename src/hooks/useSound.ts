import { useEffect, useRef, useState, useCallback } from 'react';

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Set up interaction listener
  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Initialize audio after first interaction
  useEffect(() => {
    if (hasInteracted && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU1vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==';
      audioRef.current.volume = 0.5;
      audioRef.current.preload = 'auto';
      audioRef.current.load();
    }
  }, [hasInteracted]);

  const playSound = useCallback(() => {
    if (!hasInteracted || !audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (error) {
      // Silently handle any errors
    }
  }, [hasInteracted]);

  return { playSound, hasInteracted };
} 