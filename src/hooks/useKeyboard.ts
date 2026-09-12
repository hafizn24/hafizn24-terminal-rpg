import { useEffect } from 'react';

type KeyHandler = () => void;

interface KeyMap {
  [key: string]: KeyHandler;
}

export function useKeyboard(keyMap: KeyMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const handler = keyMap[e.key.toLowerCase()] || keyMap[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap]);
}
