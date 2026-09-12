const STORAGE_KEY = 'terminal_rpg_save';

export interface SaveData {
  player: import('../types/game').Player;
  dungeon: import('../types/game').DungeonState | null;
  quests: import('../types/game').Quest[];
  lastSave: string;
}

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
    return JSON.parse(json) as SaveData;
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

export function getStorageUsage(): { used: number; total: number } {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage.getItem(key)?.length ?? 0;
    }
  }
  return {
    used: total,
    total: 5 * 1024 * 1024,
  };
}
