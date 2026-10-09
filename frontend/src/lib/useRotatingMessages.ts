import { useState, useEffect } from 'react';

/**
 * Custom hook to cycle through dynamic status messages during long-running tasks.
 * Keeps user informed about background engine operations without altering UI layout.
 */
export function useRotatingMessages(
  messages: string[],
  intervalMs: number = 1400,
  isActive: boolean = true
): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isActive || !messages || messages.length === 0) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isActive, intervalMs, messages.length]);

  if (!messages || messages.length === 0) return '';
  return messages[index] || messages[0];
}
