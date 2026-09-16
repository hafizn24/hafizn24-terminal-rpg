/**
 * Pure combat math. ZERO React imports — safe to unit-test, simulate, replay.
 *
 * The UI layer (CombatScreen) delegates to these helpers instead of owning
 * its own copies. Variance-taking functions receive the random roll as an
 * explicit argument so tests can pin it; the seeded `Rng` lives in
 * `engine/rng.ts` and callers pass `rng.next()` in.
 */

export type PrimaryStat = 'str' | 'dex' | 'int';

/** Primary attack stat per class (mage/cleric cast, rogue strikes, warrior hits). */
export function getPrimaryStatForClass(cls: string): PrimaryStat {
  switch (cls) {
    case 'rogue':
      return 'dex';
    case 'mage':
    case 'cleric':
      return 'int';
    case 'warrior':
    default:
      return 'str';
  }
}

export interface GearLike {
  statBonus?: Partial<Record<string, number>> | null;
}

export interface FighterLike {
  class: string;
  stats: { str: number; dex: number; int: number };
  equipment: { weapon?: GearLike | null; accessory?: GearLike | null };
}

/** Sum of offensive gear bonuses (str/dex/int) from weapon + accessory. */
export function getGearOffense(p: Pick<FighterLike, 'equipment'>): number {
  const w = p.equipment.weapon?.statBonus;
  const a = p.equipment.accessory?.statBonus;
  return (w?.str || 0) + (w?.dex || 0) + (w?.int || 0) + (a?.str || 0) + (a?.dex || 0) + (a?.int || 0);
}

/** Basic attack: class primary stat + all offensive gear bonuses. */
export function getPrimaryAttack(p: FighterLike): number {
  return p.stats[getPrimaryStatForClass(p.class)] + getGearOffense(p);
}

export interface GearTotals {
  str?: number;
  dex?: number;
  int?: number;
}

/**
 * Per-class skill scaling. Gear totals scale with the same weights as base
 * stats (so staves boost Fireball, daggers boost Backstab).
 */
export function getSkillAttack(
  p: { class: string; stats: { str: number; dex: number; int: number } },
  gear: GearTotals = {},
): number {
  const tStr = p.stats.str + (gear.str || 0);
  const tDex = p.stats.dex + (gear.dex || 0);
  const tInt = p.stats.int + (gear.int || 0);
  switch (p.class) {
    case 'warrior':
      return tStr * 2 + tInt * 0.3;
    case 'mage':
      return tStr * 0.4 + tInt * 2.2;
    case 'rogue':
      return tStr + tDex * 1.2 + tInt * 0.3;
    case 'cleric':
      return tStr * 0.7 + tInt * 1.6;
    default:
      return tStr + tInt;
  }
}

export interface DefHolder {
  stats: { def?: number };
  equipment: {
    armor?: GearLike | null;
    accessory?: GearLike | null;
  };
}

/** Total mitigation: base DEF + armor + accessory DEF bonuses. */
export function getPlayerDefTotal(p: DefHolder): number {
  return (
    (p.stats.def ?? 0) +
    (p.equipment.armor?.statBonus?.def || 0) +
    (p.equipment.accessory?.statBonus?.def || 0)
  );
}

/**
 * Damage before variance: max(1, atk - def * 0.5). Pure — the caller supplies
 * the variance roll (0.85–1.15 in production, pinned in tests).
 */
export function baseDamage(attackerAtk: number, defenderDef: number): number {
  return Math.max(1, attackerAtk - defenderDef * 0.5);
}

export function applyVariance(base: number, varianceRoll: number): number {
  return Math.floor(base * varianceRoll);
}

/** Full damage roll from an explicit variance roll. */
export function rollDamageWithVariance(
  attackerAtk: number,
  defenderDef: number,
  varianceRoll: number,
): number {
  return applyVariance(baseDamage(attackerAtk, defenderDef), varianceRoll);
}

/** Crit chance from DEX. Capped at 40%. */
export function critChanceForDex(dex: number): number {
  return Math.min(0.4, 0.05 + dex * 0.01);
}

/**
 * Dodge chance from DEX difference. Guarding adds a flat bonus.
 * Capped at 30% so fights never become untouchable.
 */
export function dodgeChanceForDex(playerDex: number, enemyDex: number, guarding = false): number {
  const base = 0.05 + (playerDex - enemyDex) * 0.01 + (guarding ? 0.15 : 0);
  return Math.min(0.3, Math.max(0, base));
}

/** Intent damage preview range (mirrors the in-fight formula bounds). */
export function intentPreviewRange(intentBase: number, playerDef: number): { min: number; max: number } {
  return {
    min: Math.max(1, Math.floor((intentBase - playerDef * 0.5) * 0.85)),
    max: Math.max(1, Math.floor((intentBase - playerDef * 0.5) * 1.15)),
  };
}

/** Depth-scaled trap rating for the dodge check (rogues slip, warriors tank). */
export function trapDexForFloor(floor: number): number {
  return 8 + floor;
}
