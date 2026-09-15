import type { Enemy } from '../../types/game';
import { isBossFloor } from '../systems/dungeonGenerator';

/**
 * Shared helpers + retired ASCII overlays.
 *
 * UI is text-only (no character art): `ELITE_CROWN_ART` and
 * `BOSS_AURA_TOP/BOTTOM` are data-only and unused by render — do not
 * re-add them without a design decision. Live helpers: `isBossEnemy()`,
 * `getFloorTheme()`.
 *
 * All glyphs are monospace-safe (block elements + box drawing only):
 * no emoji/CJK, so columns stay aligned in JetBrains Mono.
 */

/** Retired: crown formerly rendered above elite sprites. Data-only. */
export const ELITE_CROWN_ART = `    \\\\  ^  /
     \\\\^ ^/
    ▓▓▓▓▓▓▓
    ▓▓▓▓▓▓▓`;

/** Retired: aura bars formerly rendered around boss sprites. Data-only. */
export const BOSS_AURA_TOP = `  ░▒▓█████▓▒░`;
export const BOSS_AURA_BOTTOM = `  ░▒▓█████▓▒░`;

const BOSS_IDS = new Set(['goblin_king', 'necromancer', 'dragon_lord', 'demon_king']);

export function isBossEnemy(enemy: Enemy): boolean {
  if (BOSS_IDS.has(enemy.id)) return true;
  return (
    enemy.id.includes('king') ||
    enemy.id.includes('mancer') ||
    enemy.id.includes('dragon_lord') ||
    enemy.id.includes('demon')
  );
}

/** Floor tint for the dungeon map frame: deeper = hotter, boss = red. */
export function getFloorTheme(floor: number): {
  frame: string;
  label: string;
  labelClass: string;
} {
  if (isBossFloor(floor)) {
    return {
      frame: 'border-terminal-red/60',
      label: `FLOOR ${floor} — BOSS`,
      labelClass: 'text-terminal-red animate-pulse-glow',
    };
  }
  if (floor >= 7) {
    return {
      frame: 'border-terminal-yellow/40',
      label: `FLOOR ${floor} — DEEP`,
      labelClass: 'text-terminal-yellow',
    };
  }
  if (floor >= 4) {
    return {
      frame: 'border-terminal-green/40',
      label: `FLOOR ${floor}`,
      labelClass: 'text-terminal-green',
    };
  }
  return {
    frame: 'border-terminal-dim/20',
    label: `FLOOR ${floor}`,
    labelClass: 'text-terminal-cyan',
  };
}
