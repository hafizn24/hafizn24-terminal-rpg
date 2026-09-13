import { create } from 'zustand';
import type { Player, DungeonState, Quest, Screen } from '../../types/game';
import { saveGame, loadGame, hasSaveData, deleteSave } from '../../utils/storage';
import { CLASSES } from '../../game/data/classes';
import { ITEMS } from '../../game/data/items';
import { checkQuestProgress, isQuestComplete } from '../../game/systems/questSystem';

type ShopType = 'blacksmith' | 'potion_shop' | 'magic_shop';

interface GameStore {
  currentScreen: Screen;
  player: Player | null;
  dungeon: DungeonState | null;
  quests: Quest[];
  gameOverMessage: string;
  hasSave: boolean;
  selectedShop: ShopType;

  setScreen: (screen: Screen) => void;
  setSelectedShop: (shop: ShopType) => void;
  createPlayer: (name: string, classId: string) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setDungeon: (dungeon: DungeonState | null) => void;
  setQuests: (quests: Quest[]) => void;
  setGameOver: (message: string) => void;
  save: () => boolean;
  load: () => boolean;
  newGame: () => void;
  checkSave: () => void;
  updateQuestProgress: (eventType: string, target: string, value?: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: 'title',
  player: null,
  dungeon: null,
  quests: [],
  gameOverMessage: '',
  hasSave: false,
  selectedShop: 'blacksmith' as ShopType,

  setScreen: (screen) => set({ currentScreen: screen }),

  setSelectedShop: (shop) => set({ selectedShop: shop }),

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
        { item: ITEMS['hp_potion_s'], quantity: 3 },
      ],
      equipment: { weapon: null, armor: null, accessory: null },
      floor: 1,
    };

    set({ player, currentScreen: 'town' });

    // Persist to localStorage immediately so refresh preserves the save
    const success = saveGame({ player, dungeon: null, quests: [], lastSave: new Date().toISOString() });
    if (success) set({ hasSave: true });
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
    const success = saveGame({ player, dungeon, quests, lastSave: new Date().toISOString() });
    if (success) set({ hasSave: true });
    return success;
  },

  load: () => {
    const data = loadGame();
    if (!data) return false;
    set({
      player: data.player,
      dungeon: data.dungeon,
      quests: data.quests || [],
      currentScreen: data.dungeon ? 'dungeon' : 'town',
      hasSave: true,
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
      hasSave: false,
      selectedShop: 'blacksmith',
    });
  },

  checkSave: () => {
    set({ hasSave: hasSaveData() });
  },

  updateQuestProgress: (eventType, target, value) => {
    const { quests, player } = get();
    const updated = quests.map((q) => {
      if (q.completed) return q;
      if (!checkQuestProgress(q, eventType, target)) return q;
      let newProgress: number;
      if (q.objective.type === 'floor') {
        newProgress = Math.max(q.progress, value ?? player?.floor ?? 0);
      } else if (q.objective.type === 'gold') {
        newProgress = Math.max(q.progress, value ?? player?.gold ?? 0);
      } else {
        newProgress = q.progress + 1;
      }
      const completed = isQuestComplete({ ...q, progress: newProgress });
      return { ...q, progress: newProgress, completed };
    });
    set({ quests: updated });
  },
}));
