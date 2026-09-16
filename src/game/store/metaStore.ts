import { create } from 'zustand';
import type { DailyEntry, MetaState } from '../../types/game';
import { getUpgrade } from '../data/meta';
import { loadDailyBoard, loadMeta, recordDailyEntry, saveMeta } from '../../utils/metaStorage';

interface MetaStore {
  shards: number;
  upgrades: Record<string, number>;
  kills: Record<string, number>;
  endlessUnlocked: boolean;
  /** Last write per screen mount — lets UI refresh without subscriptions. */
  updatedAt: number;

  refresh: () => void;
  earnShards: (amount: number) => void;
  buyUpgrade: (id: string) => boolean;
  recordKill: (enemyId: string) => void;
  unlockEndless: () => void;
  recordDaily: (dateKey: string, entry: DailyEntry) => DailyEntry[];
  getDailyBoard: (dateKey: string) => DailyEntry[];
}

function persist(s: MetaState): void {
  saveMeta(s);
}

function snapshot(s: MetaStore): MetaState {
  return { shards: s.shards, upgrades: s.upgrades, kills: s.kills, endlessUnlocked: s.endlessUnlocked };
}

export const useMetaStore = create<MetaStore>((set, get) => ({
  shards: 0,
  upgrades: {},
  kills: {},
  endlessUnlocked: false,
  updatedAt: 0,

  refresh: () => {
    const m = loadMeta();
    set({ shards: m.shards, upgrades: m.upgrades, kills: m.kills, endlessUnlocked: m.endlessUnlocked, updatedAt: Date.now() });
  },

  earnShards: (amount) => {
    const s = get();
    const shards = s.shards + Math.max(0, Math.floor(amount));
    set({ shards, updatedAt: Date.now() });
    persist({ ...snapshot(s), shards });
  },

  buyUpgrade: (id) => {
    const s = get();
    const def = getUpgrade(id);
    if (!def) return false;
    const rank = s.upgrades[id] ?? 0;
    if (rank >= def.maxRank) return false;
    const cost = def.costs[rank] ?? Infinity;
    if (s.shards < cost) return false;
    const shards = s.shards - cost;
    const upgrades = { ...s.upgrades, [id]: rank + 1 };
    set({ shards, upgrades, updatedAt: Date.now() });
    persist({ ...snapshot(s), shards, upgrades });
    return true;
  },

  recordKill: (enemyId) => {
    const s = get();
    const kills = { ...s.kills, [enemyId]: (s.kills[enemyId] ?? 0) + 1 };
    set({ kills, updatedAt: Date.now() });
    persist({ ...snapshot(s), kills });
  },

  unlockEndless: () => {
    const s = get();
    if (s.endlessUnlocked) return;
    set({ endlessUnlocked: true, updatedAt: Date.now() });
    persist({ ...snapshot(s), endlessUnlocked: true });
  },

  recordDaily: (dateKey, entry) => recordDailyEntry(dateKey, entry),

  getDailyBoard: (dateKey) => loadDailyBoard(dateKey),
}));
