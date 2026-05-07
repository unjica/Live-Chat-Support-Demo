let audio: HTMLAudioElement | null = null;

/**
 * Lazily create a tiny in-memory notification sound for chat alerts.
 *
 * @returns {{ play: () => void }} Object with a `play` method that replays from the start.
 */
export function createNotificationSound() {
  if (!audio) {
    audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    audio.preload = 'auto';
  }

  return {
    /** Replay the notification tone from the beginning (best-effort; may noop after errors). */
    play: () => {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          audio = null;
        });
      }
    }
  };
} 