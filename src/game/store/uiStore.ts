import { create } from 'zustand';
import type { LogMessage } from '../../types/game';

interface UIStore {
  logMessages: LogMessage[];
  showModal: boolean;
  modalContent: React.ReactNode | null;
  nextLogId: number;

  addLog: (text: string, type?: LogMessage['type']) => void;
  clearLog: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  logMessages: [],
  showModal: false,
  modalContent: null,
  nextLogId: 1,

  addLog: (text, type = 'info') =>
    set((state) => ({
      logMessages: [
        ...state.logMessages.slice(-50),
        { id: state.nextLogId, text, type, timestamp: Date.now() },
      ],
      nextLogId: state.nextLogId + 1,
    })),

  clearLog: () => set({ logMessages: [] }),

  openModal: (content) => set({ showModal: true, modalContent: content }),
  closeModal: () => set({ showModal: false, modalContent: null }),
}));
