import { create } from 'zustand';
import type { Player, DungeonState, Quest, Screen } from '../../types/game';
import { saveGame, loadGame, hasSaveData, deleteSave } from '../../utils/storage';
import { CLASSES } from '../../game/data/classes';
import { checkQuestProgress, isQuestComplete } from '../../game/systems/questSystem';

interface GameStore {
  currentScreen: Screen;
  player: Player | null;
  dungeon: DungeonState | null;
  quests: Quest[];
  gameOverMessage: string;
  hasSave: boolean;

  setScreen: (screen: Screen) => void;
  createPlayer: (name: string, classId: string) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setDungeon: (dungeon: DungeonState | null) => void;
  setQuests: (quests: Quest[]) => void;
  setGameOver: (message: string) => void;
  save: () => boolean;
  load: () => boolean;
  newGame: () => void;
  checkSave: () => void;
  updateQuestProgress: (eventType: string, target: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: 'title',
  player: null,
  dungeon: null,
  quests: [],
  gameOverMessage: '',
  hasSave: false,

  setScreen: (screen) => set({ currentScreen: screen }),

  createPlayer: (name, classId) => {
    const classDef = CLASSES.find((c) => c.id === classId);
    if (!classDef) return;

    const player: Player = {
      name,
      class: classDef.id,
      level: 1,
      exp: 0,
      expToNext: 50,
      stats: { ...classDef.baseStats },
      gold: 50,
      inventory: [
        { item: { id: 'hp_potion_s', name: 'Minor HP Potion', type: 'potion', rarity: 'common', description: 'Restores 30 HP.', price: 25, healAmount: 30 }, quantity: 3 },
      ],
      equipment: { weapon: null, armor: null, accessory: null },
      floor: 1,
    };

    set({ player, currentScreen: 'town' });
  },

  updatePlayer: (updates) => {
    const { player } = get();
    if (!player) return;
    set({ player: { ...player, ...updates } });
  },

  setDungeon: (dungeon) => set({ dungeon }),

  setQuests: (quests) => set({ quests }),

  setGameOver: (message) => set({ gameOverMessage: message, currentScreen: 'gameOver' }),

  save: () => {
    const { player, dungeon, quests } = get();
    if (!player) return false;
    return saveGame({ player, dungeon, quests, lastSave: new Date().toISOString() });
  },

  load: () => {
    const data = loadGame();
    if (!data) return false;
    set({
      player: data.player,
      dungeon: data.dungeon,
      quests: data.quests || [],
      currentScreen: data.dungeon ? 'dungeon' : 'town',
    });
    return true;
  },

  newGame: () => {
    deleteSave();
    set({
      player: null,
      dungeon: null,
      quests: [],
      currentScreen: 'classSelect',
      gameOverMessage: '',
    });
  },

  checkSave: () => {
    set({ hasSave: hasSaveData() });
  },

  updateQuestProgress: (eventType, target) => {
    const { quests } = get();
    const updated = quests.map((q) => {
      if (q.completed) return q;
      if (!checkQuestProgress(q, eventType, target)) return q;
      const newProgress = q.progress + 1;
      const completed = isQuestComplete({ ...q, progress: newProgress });
      return { ...q, progress: newProgress, completed };
    });
    set({ quests: updated });
  },
}));
