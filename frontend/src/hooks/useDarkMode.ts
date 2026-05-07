import { useEffect, useState } from 'react';

/**
 * Sync dark mode with `localStorage`, system preference, and the `dark` class on `<html>`.
 *
 * @returns `{ isDarkMode, toggleDarkMode, mounted }` — `mounted` avoids SSR hydration mismatch.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to window
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedMode ? savedMode === 'true' : prefersDark);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('darkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, mounted]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, toggleDarkMode, mounted };
} 