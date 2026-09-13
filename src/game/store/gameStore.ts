import { create } from 'zustand';
import type { Player, DungeonState, Quest, Screen, GameStats } from '../../types/game';
import { saveGame, loadGame, hasSaveData, deleteSave, DEFAULT_STATS } from '../../utils/storage';
import { CLASSES } from '../../game/data/classes';
import { ITEMS } from '../../game/data/items';
import { checkQuestProgress, isQuestComplete } from '../../game/systems/questSystem';
import { calcExpForLevel } from '../../utils/rng';

export type ShopType = 'blacksmith' | 'potion_shop' | 'magic_shop';
export type ShopReturn = 'town' | 'dungeon';

interface GameStore {
  currentScreen: Screen;
  player: Player | null;
  dungeon: DungeonState | null;
  quests: Quest[];
  gameOverMessage: string;
  hasSave: boolean;
  selectedShop: ShopType;
  shopReturn: ShopReturn;
  lastSave: string;
  stats: GameStats;

  setScreen: (screen: Screen) => void;
  setSelectedShop: (shop: ShopType, ret?: ShopReturn) => void;
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
  addItem: (itemId: string, quantity?: number) => void;
  gainExp: (amount: number) => string[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: 'title',
  player: null,
  dungeon: null,
  quests: [],
  gameOverMessage: '',
  hasSave: false,
  selectedShop: 'blacksmith' as ShopType,
  shopReturn: 'town' as ShopReturn,
  lastSave: '',
  stats: { ...DEFAULT_STATS },

  setScreen: (screen) => set({ currentScreen: screen }),

  setSelectedShop: (shop, ret) =>
    set((s) => ({ selectedShop: shop, shopReturn: ret ?? s.shopReturn })),

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

    const stats: GameStats = {
      bestFloor: 1,
      bossesKilled: 0,
      runsStarted: get().stats.runsStarted + 1,
    };

    set({ player, stats, currentScreen: 'town' });

    // Persist to localStorage immediately so refresh preserves the save
    const success = saveGame({
      version: 1,
      player,
      dungeon: null,
      quests: [],
      lastSave: new Date().toISOString(),
      stats,
    });
    if (success) set({ hasSave: true, lastSave: new Date().toISOString() });
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
    const { player, dungeon, quests, stats } = get();
    if (!player) return false;
    const lastSave = new Date().toISOString();
    const success = saveGame({ version: 1, player, dungeon, quests, lastSave, stats });
    if (success) set({ hasSave: true, lastSave });
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
      lastSave: data.lastSave,
      stats: data.stats,
    });
    return true;
  },

  newGame: () => {
    deleteSave();
    set((s) => ({
      player: null,
      dungeon: null,
      quests: [],
      currentScreen: 'classSelect',
      gameOverMessage: '',
      hasSave: false,
      selectedShop: 'blacksmith',
      shopReturn: 'town' as ShopReturn,
      lastSave: '',
      stats: s.stats,
    }));
  },

  checkSave: () => {
    set({ hasSave: hasSaveData() });
    const data = loadGame();
    if (data) set({ lastSave: data.lastSave, stats: data.stats });
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

  addItem: (itemId, quantity = 1) => {
    const { player } = get();
    if (!player) return;
    const item = ITEMS[itemId];
    if (!item) return;
    const idx = player.inventory.findIndex((s) => s.item.id === itemId);
    const inventory =
      idx >= 0
        ? player.inventory.map((s, i) => (i === idx ? { ...s, quantity: s.quantity + quantity } : s))
        : [...player.inventory, { item, quantity }];
    set({ player: { ...player, inventory } });
  },

  gainExp: (amount) => {
    const { player } = get();
    if (!player) return [];
    const messages: string[] = [];
    let newExp = player.exp + amount;
    let newLevel = player.level;
    const newStats = { ...player.stats };
    let threshold = player.expToNext;

    while (newExp >= threshold) {
      newExp -= threshold;
      newLevel++;
      const classDef = CLASSES.find((c) => c.id === player.class);
      if (classDef) {
        newStats.str += classDef.growth.str;
        newStats.dex += classDef.growth.dex;
        newStats.int += classDef.growth.int;
        newStats.maxHp += classDef.growth.hp;
        newStats.maxMp += classDef.growth.mp;
        newStats.hp = newStats.maxHp;
        newStats.mp = newStats.maxMp;
      }
      threshold = calcExpForLevel(newLevel);
      messages.push(`LEVEL UP! Now level ${newLevel}!`);
    }

    set({ player: { ...player, level: newLevel, exp: newExp, expToNext: threshold, stats: newStats } });
    return messages;
  },
}));
