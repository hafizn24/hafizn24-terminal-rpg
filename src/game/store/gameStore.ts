import { create } from 'zustand';
import type { Player, DungeonState, Quest, Screen, GameStats, RunStats, RunSummary, StatType } from '../../types/game';
import { saveGame, loadGame, hasSaveData, deleteSave, DEFAULT_STATS } from '../../utils/storage';
import { CLASSES } from '../../game/data/classes';
import { ITEMS } from '../../game/data/items';
import { checkQuestProgress, isQuestComplete } from '../../game/systems/questSystem';
import {
  CHECKPOINT_INTERVAL,
  FINAL_FLOOR,
  generateDungeon,
  isBossFloor,
} from '../../game/systems/dungeonGenerator';
import { applyStatPointToStats, planLevelUps } from '../../engine/rules/progression';
import { getDailySeedForKey, randomSeed, rngForFloor } from '../../engine/rng';
import { shardsForRun } from '../data/meta';
import { classifyDeath, recordTelemetryEvent } from '../../utils/telemetry';
import { useMetaStore } from './metaStore';

export type ShopType = 'blacksmith' | 'potion_shop' | 'magic_shop';
export type ShopReturn = 'town' | 'dungeon';
export type StatsReturn = 'town' | 'inventory' | 'dungeon';

/** Re-exported so screens have one import for checkpoint rules. Boss = save point. */
export { CHECKPOINT_INTERVAL, isBossFloor as isCheckpointFloor };

/** Last checkpoint at or below the given floor (floors 1-4 have none yet). */
export function getLastCheckpoint(floor: number): number | null {
  if (floor < CHECKPOINT_INTERVAL) return null;
  return Math.floor(floor / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
}

interface GameStore {
  currentScreen: Screen;
  player: Player | null;
  dungeon: DungeonState | null;
  quests: Quest[];
  gameOverMessage: string;
  hasSave: boolean;
  selectedShop: ShopType;
  shopReturn: ShopReturn;
  statsReturn: StatsReturn;
  lastSave: string;
  stats: GameStats;
  /** Seed for deterministic dungeon generation (null = legacy unseeded save). */
  runSeed: number | null;
  /** `YYYY-MM-DD` when this run is a daily challenge, else null. */
  dailyKey: string | null;
  /** Live per-run telemetry for the death summary. Null outside a run. */
  run: RunStats | null;
  /** Frozen at death for the Run Summary screen. */
  lastSummary: RunSummary | null;
  /** True when the run ended by slaying the floor-30 boss (ending screen). */
  gameWon: boolean;

  setScreen: (screen: Screen) => void;
  setSelectedShop: (shop: ShopType, ret?: ShopReturn) => void;
  setStatsReturn: (ret: StatsReturn) => void;
  createPlayer: (name: string, classId: string) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setDungeon: (dungeon: DungeonState | null) => void;
  setQuests: (quests: Quest[]) => void;
  setGameOver: (message: string) => void;
  save: () => boolean;
  load: () => boolean;
  newGame: () => void;
  /** Reset into class-select for a daily challenge on `dateKey` (YYYY-MM-DD). */
  startDaily: (dateKey: string) => void;
  checkSave: () => void;
  updateQuestProgress: (eventType: string, target: string, value?: number) => void;
  addItem: (itemId: string, quantity?: number) => void;
  gainExp: (amount: number) => string[];
  allocateStatPoint: (stat: StatType) => boolean;
  recordRunKill: (gold: number, wasBoss: boolean) => void;
  recordRunDamage: (amount: number) => void;
  recordRunFloor: (floor: number) => void;
  addRelic: (id: string) => void;
  /** Summit the 30-floor spine: payout + bonus, unlock endless, show the ending. */
  completeEnding: () => void;
  /** Break the seal: descend to floor 31+ with the same hero. */
  continueEndless: () => void;
}

/** Re-exported from the engine so UI has one import for point economics. */
export { STAT_POINTS_PER_LEVEL, HP_PER_STAT_POINT, MP_PER_STAT_POINT } from '../../engine/rules/progression';

export function freshRunStats(): RunStats {
  return {
    kills: 0,
    damageDealt: 0,
    biggestHit: 0,
    goldEarned: 0,
    floorsClimbed: 0,
    bossesKilled: 0,
    startedAt: new Date().toISOString(),
  };
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
  statsReturn: 'town' as StatsReturn,
  lastSave: '',
  stats: { ...DEFAULT_STATS },
  runSeed: null,
  dailyKey: null,
  run: null,
  lastSummary: null,
  gameWon: false,

  setScreen: (screen) => set({ currentScreen: screen }),

  setSelectedShop: (shop, ret) =>
    set((s) => ({ selectedShop: shop, shopReturn: ret ?? s.shopReturn })),

  setStatsReturn: (ret) => set({ statsReturn: ret }),

  createPlayer: (name, classId) => {
    const classDef = CLASSES.find((c) => c.id === classId);
    if (!classDef) return;

    // Deterministic seed: daily challenge shares one seed per calendar day.
    const dailyKey = get().dailyKey;
    const runSeed = dailyKey ? getDailySeedForKey(dailyKey) : randomSeed();

    // Meta-progression unlocks apply at run start (all earned through play).
    const upgrades = useMetaStore.getState().upgrades;
    const vigorRank = upgrades['vigor'] ?? 0;
    const wealthRank = upgrades['wealth'] ?? 0;
    const talentRank = upgrades['talent'] ?? 0;
    const preparedRank = upgrades['prepared'] ?? 0;

    const baseStats = { ...classDef.baseStats, maxHp: classDef.baseStats.maxHp + vigorRank * 10 };
    baseStats.hp = baseStats.maxHp;

    const player: Player = {
      name,
      class: classDef.id,
      level: 1,
      exp: 0,
      expToNext: 50,
      stats: baseStats,
      gold: 50 + wealthRank * 25,
      inventory: [
        { item: ITEMS['hp_potion_s'], quantity: 3 + preparedRank },
      ],
      equipment: { weapon: null, armor: null, accessory: null },
      floor: 1,
      statPoints: talentRank,
      relics: [],
    };

    const stats: GameStats = {
      bestFloor: 1,
      bossesKilled: 0,
      runsStarted: get().stats.runsStarted + 1,
    };

    set({ player, stats, currentScreen: 'town', runSeed, run: freshRunStats(), gameWon: false, lastSummary: null });
    recordTelemetryEvent({ t: 'runStarted', classId: player.class });

    // Persist to localStorage immediately so refresh preserves the save
    const success = saveGame({
      version: 1,
      player,
      dungeon: null,
      quests: [],
      lastSave: new Date().toISOString(),
      stats,
      runSeed,
      dailyKey,
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

  setGameOver: (message) => {
    const { player, run, dailyKey } = get();
    if (player) {
      const floorReached = player.floor;
      const bosses = run?.bossesKilled ?? 0;
      const shards = shardsForRun(floorReached, bosses);
      // Meta-progression payout: depth pays, bosses pay double-digit.
      useMetaStore.getState().earnShards(shards);
      const summary: RunSummary = {
        kills: run?.kills ?? 0,
        damageDealt: run?.damageDealt ?? 0,
        biggestHit: run?.biggestHit ?? 0,
        goldEarned: run?.goldEarned ?? 0,
        floorsClimbed: run?.floorsClimbed ?? 0,
        bossesKilled: bosses,
        startedAt: run?.startedAt ?? new Date().toISOString(),
        floorReached,
        level: player.level,
        classId: player.class,
        shardsEarned: shards,
        isDaily: dailyKey !== null,
      };
      if (dailyKey) {
        useMetaStore.getState().recordDaily(dailyKey, {
          name: player.name,
          classId: player.class,
          floor: floorReached,
          bosses,
          ts: Date.now(),
        });
      }
      recordTelemetryEvent({
        t: 'runEnded',
        won: false,
        classId: player.class,
        floor: floorReached,
        level: player.level,
        cause: classifyDeath(message),
      });
      set({ gameOverMessage: message, currentScreen: 'gameOver', lastSummary: summary, gameWon: false });
      return;
    }
    set({ gameOverMessage: message, currentScreen: 'gameOver', gameWon: false });
  },

  save: () => {
    const { player, dungeon, quests, stats, runSeed, dailyKey } = get();
    if (!player) return false;
    // Persist the active floor map for the whole run so re-entering a floor
    // resumes the same cleared rooms instead of rerolling fresh loot.
    // Checkpoints (boss floors) still mark committed progress; fleeing keeps
    // the in-memory map and this save preserves it across reloads.
    const lastSave = new Date().toISOString();
    const success = saveGame({ version: 1, player, dungeon, quests, lastSave, stats, runSeed, dailyKey });
    if (success) set({ hasSave: true, lastSave });
    return success;
  },

  load: () => {
    const data = loadGame();
    if (!data) return false;
    // All schema migration lives in storage.loadGame (migrate() dispatcher) —
    // the single copy, so the two can never drift apart again.
    set({
      player: data.player,
      dungeon: data.dungeon,
      quests: data.quests || [],
      currentScreen: data.dungeon ? 'dungeon' : 'town',
      hasSave: true,
      lastSave: data.lastSave,
      stats: data.stats,
      runSeed: data.runSeed ?? null,
      dailyKey: data.dailyKey ?? null,
      // A loaded run starts fresh telemetry — the summary belongs to the death.
      run: freshRunStats(),
      gameWon: false,
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
      statsReturn: 'town' as StatsReturn,
      lastSave: '',
      stats: s.stats,
      runSeed: null,
      dailyKey: null,
      run: null,
      gameWon: false,
    }));
  },

  startDaily: (dateKey) => {
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
      statsReturn: 'town' as StatsReturn,
      lastSave: '',
      stats: s.stats,
      runSeed: null,
      dailyKey: dateKey,
      run: null,
      gameWon: false,
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
    // Delegates to the pure engine so the curve is unit-testable.
    const classDef = CLASSES.find((c) => c.id === player.class);
    const result = planLevelUps(
      {
        level: player.level,
        exp: player.exp,
        expToNext: player.expToNext,
        stats: player.stats,
        statPoints: player.statPoints ?? 0,
      },
      amount,
      classDef,
    );
    set({
      player: {
        ...player,
        level: result.level,
        exp: result.exp,
        expToNext: result.expToNext,
        stats: result.stats,
        statPoints: result.statPoints,
      },
    });
    return result.messages;
  },

  allocateStatPoint: (stat) => {
    const { player } = get();
    if (!player || (player.statPoints ?? 0) <= 0) return false;
    const { stats, spent } = applyStatPointToStats(player.stats, stat);
    if (!spent) return false;
    set({ player: { ...player, stats, statPoints: player.statPoints - 1 } });
    return true;
  },

  recordRunKill: (gold, wasBoss) => {
    const { run } = get();
    if (!run) return;
    set({
      run: {
        ...run,
        kills: run.kills + 1,
        goldEarned: run.goldEarned + gold,
        bossesKilled: run.bossesKilled + (wasBoss ? 1 : 0),
      },
    });
  },

  recordRunDamage: (amount) => {
    const { run } = get();
    if (!run || amount <= 0) return;
    set({
      run: {
        ...run,
        damageDealt: run.damageDealt + amount,
        biggestHit: Math.max(run.biggestHit, amount),
      },
    });
  },

  recordRunFloor: (floor) => {
    const { run } = get();
    if (!run) return;
    set({ run: { ...run, floorsClimbed: Math.max(run.floorsClimbed, floor) } });
  },

  addRelic: (id) => {
    const { player } = get();
    if (!player || player.relics.includes(id)) return;
    set({ player: { ...player, relics: [...player.relics, id] } });
    get().save();
  },

  completeEnding: () => {
    const { player, run, dailyKey } = get();
    if (!player) return;
    const bosses = run?.bossesKilled ?? 0;
    // Summit bonus on top of the normal depth payout.
    const shards = shardsForRun(player.floor, bosses) + 50;
    useMetaStore.getState().earnShards(shards);
    useMetaStore.getState().unlockEndless();
    const summary: RunSummary = {
      kills: run?.kills ?? 0,
      damageDealt: run?.damageDealt ?? 0,
      biggestHit: run?.biggestHit ?? 0,
      goldEarned: run?.goldEarned ?? 0,
      floorsClimbed: run?.floorsClimbed ?? player.floor,
      bossesKilled: bosses,
      startedAt: run?.startedAt ?? new Date().toISOString(),
      floorReached: player.floor,
      level: player.level,
      classId: player.class,
      shardsEarned: shards,
      isDaily: dailyKey !== null,
    };
    if (dailyKey) {
      useMetaStore.getState().recordDaily(dailyKey, {
        name: player.name,
        classId: player.class,
        floor: player.floor,
        bosses,
        ts: Date.now(),
      });
    }
    recordTelemetryEvent({
      t: 'runEnded',
      won: true,
      classId: player.class,
      floor: player.floor,
      level: player.level,
    });
    set({ lastSummary: summary, gameWon: true, currentScreen: 'ending' });
  },

  continueEndless: () => {
    const { player, runSeed } = get();
    if (!player) return;
    const seed = runSeed ?? randomSeed();
    const nextFloor = FINAL_FLOOR + 1;
    set({
      player: { ...player, floor: nextFloor },
      dungeon: generateDungeon(nextFloor, rngForFloor(seed, nextFloor)),
      runSeed: seed,
      gameWon: false,
      currentScreen: 'dungeon',
    });
    get().recordRunFloor(nextFloor);
    get().save();
  },
}));
