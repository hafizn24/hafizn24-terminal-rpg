import type { DailyEntry, MetaState } from '../types/game';

const META_KEY = 'terminal_rpg_meta';
const DAILY_KEY = 'terminal_rpg_daily';

export const DEFAULT_META: MetaState = { shards: 0, upgrades: {}, kills: {}, endlessUnlocked: false };

export function loadMeta(): MetaState {
  try {
    const json = localStorage.getItem(META_KEY);
    if (!json) return { ...DEFAULT_META };
    const parsed = JSON.parse(json) as Partial<MetaState>;
    return {
      shards: typeof parsed.shards === 'number' ? parsed.shards : 0,
      upgrades: parsed.upgrades && typeof parsed.upgrades === 'object' ? parsed.upgrades : {},
      kills: parsed.kills && typeof parsed.kills === 'object' ? parsed.kills : {},
      endlessUnlocked: parsed.endlessUnlocked === true,
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

export function saveMeta(meta: MetaState): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to save meta progression:', e);
  }
}

export function loadDailyBoard(dateKey: string): DailyEntry[] {
  try {
    const json = localStorage.getItem(`${DAILY_KEY}:${dateKey}`);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as DailyEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordDailyEntry(dateKey: string, entry: DailyEntry, maxEntries = 20): DailyEntry[] {
  const board = [...loadDailyBoard(dateKey), entry]
    .sort((a, b) => b.floor - a.floor || b.bosses - a.bosses)
    .slice(0, maxEntries);
  try {
    localStorage.setItem(`${DAILY_KEY}:${dateKey}`, JSON.stringify(board));
  } catch (e) {
    console.error('Failed to save daily leaderboard:', e);
  }
  return board;
}
