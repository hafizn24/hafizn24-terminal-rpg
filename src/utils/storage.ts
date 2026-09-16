import type { DungeonState, GameStats, InventorySlot, Item, Player } from '../types/game';
import { CLASSES } from '../game/data/classes';
import { ITEMS } from '../game/data/items';
import { seedFromString } from '../engine/rng';

const STORAGE_KEY = 'terminal_rpg_save';

/** Current on-disk schema. Bump when the serialized shape changes. */
export const SAVE_VERSION = 2;

export interface SaveData {
  version: number;
  player: Player;
  dungeon: DungeonState | null;
  quests: import('../types/game').Quest[];
  lastSave: string;
  stats: GameStats;
  /** Seed for deterministic generation. Absent/null = legacy unseeded save. */
  runSeed?: number | null;
  /** YYYY-MM-DD when the run is a daily challenge. */
  dailyKey?: string | null;
  /** Tamper-evident hash mismatch (console-warned, still loads — solo game). */
  tampered?: boolean;
}

// --- On-disk (serialized) shapes -------------------------------------------
// Inventory/equipment persist as registry ids, resolved through ITEMS on load.
// Per-instance state rides along in instanceData, so future enchants/affixes
// don't need another schema bump. Also shrinks saves substantially.

interface SerializedSlot {
  itemId: string;
  quantity: number;
  instanceData?: Record<string, number>;
}

interface SerializedEquipment {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
}

type SerializedPlayer = Omit<Player, 'inventory' | 'equipment'> & {
  inventory: SerializedSlot[];
  equipment: SerializedEquipment;
};

interface DiskSave {
  version: number;
  hash: string;
  player: SerializedPlayer;
  dungeon: DungeonState | null;
  quests: SaveData['quests'];
  lastSave: string;
  stats: GameStats;
  runSeed?: number | null;
  dailyKey?: string | null;
}

function hashPayload(payload: Omit<DiskSave, 'hash'>): string {
  return seedFromString(JSON.stringify(payload)).toString(36);
}

function serializePlayer(player: Player): SerializedPlayer {
  const slot = (s: InventorySlot): SerializedSlot => ({
    itemId: s.item.id,
    quantity: s.quantity,
    ...(s.instanceData ? { instanceData: { ...s.instanceData } } : {}),
  });
  const equipId = (item: Item | null): string | null => item?.id ?? null;
  return {
    ...player,
    stats: { ...player.stats },
    inventory: player.inventory.map(slot),
    equipment: {
      weapon: equipId(player.equipment.weapon),
      armor: equipId(player.equipment.armor),
      accessory: equipId(player.equipment.accessory),
    },
  };
}

function resolveItem(id: string | null): Item | null {
  if (!id) return null;
  const item = ITEMS[id];
  if (!item) {
    console.warn(`Unknown item id in save: ${id} — dropped.`);
    return null;
  }
  return item;
}

function deserializePlayer(raw: SerializedPlayer): Player {
  const inventory: InventorySlot[] = [];
  for (const s of raw.inventory ?? []) {
    const item = resolveItem(s.itemId);
    if (!item || s.quantity <= 0) continue;
    inventory.push({
      item,
      quantity: Math.floor(s.quantity),
      ...(s.instanceData ? { instanceData: { ...s.instanceData } } : {}),
    });
  }
  return {
    ...(raw as Omit<SerializedPlayer, 'inventory' | 'equipment'>),
    inventory,
    equipment: {
      weapon: resolveItem(raw.equipment?.weapon ?? null),
      armor: resolveItem(raw.equipment?.armor ?? null),
      accessory: resolveItem(raw.equipment?.accessory ?? null),
    },
  };
}

// --- Migrations -------------------------------------------------------------
// Every schema change adds a step here. Old saves flow 0 -> ... -> SAVE_VERSION.

function migratePlayer(raw: Record<string, unknown>, version: number): SerializedPlayer {
  const p = { ...(raw as unknown as SerializedPlayer) };
  const lvl = (p as { level?: number }).level ?? 1;
  const classDef = CLASSES.find((c) => c.id === (p as { class?: string }).class);

  if (version < 1) {
    // v0 -> v1: manual stat distribution + defense stat did not exist.
    const sp = (p as unknown as { statPoints?: unknown }).statPoints;
    (p as unknown as { statPoints: number }).statPoints =
      typeof sp === 'number' ? sp : Math.max(0, lvl - 1) * 3;
    const stats = (p as unknown as { stats: Record<string, number> }).stats;
    if (typeof stats?.def !== 'number') {
      stats.def = (classDef?.baseStats.def ?? 3) + (classDef?.growth.def ?? 1) * Math.max(0, lvl - 1);
    }
  }
  if (version < 2) {
    // v1 -> v2: id-based slots. v1 saves hold full Item objects inline.
    const inv = (p as unknown as { inventory?: Array<{ itemId?: string; item?: Item; quantity: number; instanceData?: Record<string, number> }> }).inventory ?? [];
    (p as unknown as { inventory: SerializedSlot[] }).inventory = inv.flatMap((s) => {
      const id = s.itemId ?? s.item?.id;
      if (!id || !(s.quantity > 0)) return [];
      return [{ itemId: id, quantity: Math.floor(s.quantity), ...(s.instanceData ? { instanceData: s.instanceData } : {}) }];
    });
    const eq = (p as unknown as { equipment?: { weapon?: Item | string | null; armor?: Item | string | null; accessory?: Item | string | null } }).equipment ?? {};
    const eqId = (v: Item | string | null | undefined): string | null =>
      typeof v === 'string' ? v : (v?.id ?? null);
    (p as unknown as { equipment: SerializedEquipment }).equipment = {
      weapon: eqId(eq.weapon),
      armor: eqId(eq.armor),
      accessory: eqId(eq.accessory),
    };
    if (!Array.isArray((p as unknown as { relics?: unknown }).relics)) {
      (p as unknown as { relics: string[] }).relics = [];
    }
  }
  return p;
}

function migrateDungeon(raw: (DungeonState & { modifier?: DungeonState['modifier'] }) | null): DungeonState | null {
  if (!raw) return null;
  return { ...raw, modifier: raw.modifier ?? 'none' };
}

export function saveGame(data: SaveData): boolean {
  try {
    const payload = {
      version: SAVE_VERSION,
      player: serializePlayer(data.player),
      dungeon: data.dungeon,
      quests: data.quests,
      lastSave: data.lastSave,
      stats: data.stats,
      runSeed: data.runSeed ?? null,
      dailyKey: data.dailyKey ?? null,
    };
    const envelope: DiskSave = { ...payload, hash: hashPayload(payload) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

export function loadGame(): SaveData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<DiskSave> & {
      player?: unknown;
      version?: unknown;
    };
    // Basic validation.
    const rawPlayer = parsed.player as Record<string, unknown> | undefined;
    if (!rawPlayer || typeof (rawPlayer as { name?: unknown }).name !== 'string') return null;

    const version = typeof parsed.version === 'number' ? parsed.version : 0;
    let tampered = false;
    if (typeof (parsed as Partial<DiskSave>).hash === 'string' && version >= SAVE_VERSION) {
      const { hash, ...payload } = parsed as DiskSave;
      if (hashPayload(payload) !== hash) {
        console.warn('Save hash mismatch — localStorage may have been hand-edited. Loading anyway (solo game).');
        tampered = true;
      }
    }

    const player = deserializePlayer(migratePlayer(rawPlayer, version));
    return {
      version: SAVE_VERSION,
      player,
      dungeon: migrateDungeon(parsed.dungeon ?? null),
      quests: Array.isArray(parsed.quests) ? parsed.quests : [],
      runSeed: typeof parsed.runSeed === 'number' ? parsed.runSeed : null,
      dailyKey: typeof parsed.dailyKey === 'string' ? parsed.dailyKey : null,
      lastSave: typeof parsed.lastSave === 'string' ? parsed.lastSave : new Date().toISOString(),
      stats: {
        bestFloor: parsed.stats?.bestFloor ?? player.floor ?? 1,
        bossesKilled: parsed.stats?.bossesKilled ?? 0,
        runsStarted: parsed.stats?.runsStarted ?? 1,
      },
      tampered,
    };
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const DEFAULT_STATS: GameStats = {
  bestFloor: 1,
  bossesKilled: 0,
  runsStarted: 0,
};
