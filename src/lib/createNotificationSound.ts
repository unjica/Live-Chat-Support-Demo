let audio: HTMLAudioElement | null = null;

export function createNotificationSound() {
  if (!audio) {
    audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    audio.preload = 'auto';
  }

  return {
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