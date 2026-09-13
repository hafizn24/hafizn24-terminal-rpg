export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function calcDamage(attackerAtk: number, defenderDef: number): number {
  const base = Math.max(1, attackerAtk - defenderDef * 0.5);
  const variance = randomFloat(0.85, 1.15);
  return Math.floor(base * variance);
}

export function calcCritChance(dex: number): number {
  return Math.min(0.4, 0.05 + dex * 0.01);
}

export function calcExpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#cccccc';
    case 'uncommon': return '#00ff41';
    case 'rare': return '#00ffff';
    case 'epic': return '#bf00ff';
    default: return '#cccccc';
  }
}
