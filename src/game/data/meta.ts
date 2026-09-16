/**
 * Meta-progression catalogue. All unlocks are earned through play (shards from
 * descending + boss kills) — never sold, never pay-to-win. Selling identity
 * (themes, art packs) is fine; selling power is not.
 */

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  /** Cost in shards for the NEXT rank (index = current rank). */
  costs: number[];
}

export const META_UPGRADES: MetaUpgrade[] = [
  {
    id: 'vigor',
    name: 'Vigor',
    description: '+10 max HP at run start, per rank.',
    maxRank: 5,
    costs: [10, 20, 35, 55, 80],
  },
  {
    id: 'wealth',
    name: 'Windfall',
    description: '+25 starting gold, per rank.',
    maxRank: 5,
    costs: [8, 16, 28, 44, 65],
  },
  {
    id: 'talent',
    name: 'Talent',
    description: '+1 stat point at run start, per rank.',
    maxRank: 3,
    costs: [25, 50, 90],
  },
  {
    id: 'prepared',
    name: 'Prepared',
    description: '+1 Minor HP Potion at run start, per rank.',
    maxRank: 3,
    costs: [12, 26, 48],
  },
];

export function getUpgrade(id: string): MetaUpgrade | undefined {
  return META_UPGRADES.find((u) => u.id === id);
}

/** Shards for a finished run: depth pays, bosses pay double-digit. */
export function shardsForRun(floorReached: number, bossesKilled: number): number {
  return Math.max(1, floorReached) + bossesKilled * 10;
}
