/**
 * Relic modifiers — pure aggregation over held relic ids. ZERO React imports.
 * Combat, traps, and loot read these instead of branching per relic.
 */

export interface RelicMods {
  /** Flat dodge bonus (added after the 30% base cap, re-capped at 38%). */
  dodgeBonus: number;
  /** Basic attack damage multiplier. */
  basicMult: number;
  /** Skill MP discount (floored at 1 MP). */
  skillCostReduction: number;
  /** Victory gold multiplier. */
  goldMult: number;
  /** Trap damage multiplier. */
  trapMult: number;
  /** Flat defense bonus. */
  defBonus: number;
  /** HP healed after every combat victory. */
  healOnKill: number;
  /** Skill damage multiplier while HP is below 30%. */
  lowHpSkillMult: number;
}

export const EMPTY_RELICS: RelicMods = {
  dodgeBonus: 0,
  basicMult: 1,
  skillCostReduction: 0,
  goldMult: 1,
  trapMult: 1,
  defBonus: 0,
  healOnKill: 0,
  lowHpSkillMult: 1,
};

/** Pure fold over relic ids — unknown ids are ignored (forward-compatible). */
export function getRelicMods(relics: readonly string[]): RelicMods {
  const mods: RelicMods = { ...EMPTY_RELICS };
  for (const id of relics) {
    switch (id) {
      case 'blood_vial':
        mods.healOnKill += 8;
        break;
      case 'feather_charm':
        mods.dodgeBonus += 0.08;
        break;
      case 'whetstone':
        mods.basicMult *= 1.2;
        break;
      case 'focus_crystal':
        mods.skillCostReduction += 3;
        break;
      case 'lucky_coin':
        mods.goldMult *= 1.25;
        break;
      case 'ward_charm':
        mods.trapMult *= 0.5;
        break;
      case 'iron_hide':
        mods.defBonus += 4;
        break;
      case 'adrenaline':
        mods.lowHpSkillMult *= 1.25;
        break;
      default:
        break;
    }
  }
  return mods;
}

/** Effective MP cost of a skill after the Focus Crystal discount. */
export function effectiveSkillCost(baseCost: number, mods: RelicMods): number {
  return Math.max(1, baseCost - mods.skillCostReduction);
}

/** Unlocked skills for a level, in catalogue order. Pure (also used by the sim). */
export function unlockedSkills<T extends { unlockLevel: number }>(skills: T[], level: number): T[] {
  return skills.filter((s) => level >= s.unlockLevel);
}
