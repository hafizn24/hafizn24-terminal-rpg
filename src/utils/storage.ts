import type { GameStats } from '../types/game';

const STORAGE_KEY = 'terminal_rpg_save';

export interface SaveData {
  version: number;
  player: import('../types/game').Player;
  dungeon: import('../types/game').DungeonState | null;
  quests: import('../types/game').Quest[];
  lastSave: string;
  stats: GameStats;
}

export const DEFAULT_STATS: GameStats = {
  bestFloor: 1,
  bossesKilled: 0,
  runsStarted: 0,
};

export function saveGame(data: SaveData): boolean {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
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
    const parsed = JSON.parse(json) as Partial<SaveData>;
    // Basic validation + v0 -> v1 migration
    if (!parsed.player || typeof parsed.player.name !== 'string') return null;
    return {
      version: parsed.version ?? 0,
      player: parsed.player as SaveData['player'],
      dungeon: parsed.dungeon ?? null,
      quests: Array.isArray(parsed.quests) ? parsed.quests : [],
      lastSave: typeof parsed.lastSave === 'string' ? parsed.lastSave : new Date().toISOString(),
      stats: {
        bestFloor: parsed.stats?.bestFloor ?? parsed.player?.floor ?? 1,
        bossesKilled: parsed.stats?.bossesKilled ?? 0,
        runsStarted: parsed.stats?.runsStarted ?? 1,
      },
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
