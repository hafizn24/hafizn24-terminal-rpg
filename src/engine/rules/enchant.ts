/**
 * Pure enchanting math. ZERO React imports.
 *
 * Smithy sink for late-game gold: +1 weapon/armor up to +5.
 * Cost curve: 100 * 2^level (100/200/400/800/1600 = 3100g to max one piece).
 * Bonus: +2 offense (str/dex/int primary) and +1 DEF per level, applied
 * on top of the catalogue `statBonus` via `instanceData.enchantLevel`.
 */

export const MAX_ENCHANT_LEVEL = 5;
export const ENCHANT_BASE_COST = 100;

/** Gold cost to go from `level` -> `level + 1`. */
export function enchantCost(level: number): number {
  if (level < 0 || level >= MAX_ENCHANT_LEVEL) return Infinity;
  return ENCHANT_BASE_COST * Math.pow(2, level);
}

/** Total gold spent to reach `level` from +0. */
export function totalEnchantCost(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += enchantCost(i);
  return total;
}

/** Offense bonus granted at an enchant level (+2 per level). */
export function enchantOffenseBonus(level: number): number {
  if (level <= 0) return 0;
  return Math.min(level, MAX_ENCHANT_LEVEL) * 2;
}

/** DEF bonus granted at an enchant level (+1 per level). */
export function enchantDefenseBonus(level: number): number {
  if (level <= 0) return 0;
  return Math.min(level, MAX_ENCHANT_LEVEL) * 1;
}

/** Read the enchant level off an inventory slot's instanceData. */
export function getEnchantLevel(instanceData?: Record<string, number>): number {
  const lvl = instanceData?.enchantLevel ?? 0;
  if (typeof lvl !== 'number' || Number.isNaN(lvl)) return 0;
  return Math.max(0, Math.min(MAX_ENCHANT_LEVEL, Math.floor(lvl)));
}

/** Whether an item type can be enchanted (gear only, not potions/keys). */
export function canEnchantType(type: string): boolean {
  return type === 'weapon' || type === 'armor';
}
