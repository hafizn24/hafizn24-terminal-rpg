import { create } from 'zustand';
import type { LogMessage } from '../../types/game';

interface UIStore {
  logMessages: LogMessage[];
  nextLogId: number;

  addLog: (text: string, type?: LogMessage['type']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  logMessages: [],
  nextLogId: 1,

  addLog: (text, type = 'info') =>
    set((state) => ({
      logMessages: [
        ...state.logMessages.slice(-50),
        { id: state.nextLogId, text, type, timestamp: Date.now() },
      ],
      nextLogId: state.nextLogId + 1,
    })),
}));
