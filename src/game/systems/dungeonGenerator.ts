import type { FloorAffix, FloorModifier, Room, RoomType, DungeonState, Enemy, Item } from '../../types/game';
import { ENEMIES, BOSS_ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { randomInt, pickRandom, chance, shuffleArray } from '../../utils/rng';
import { rngChance, rngFloat, rngInt, rngPick, rngShuffle, type Rng } from '../../engine/rng';

export const FINAL_FLOOR = 30;

/** Boss floors double as save checkpoints: 5, 10, 15, ... */
export const CHECKPOINT_INTERVAL = 5;

export function isBossFloor(floor: number): boolean {
  return floor % CHECKPOINT_INTERVAL === 0;
}

export function isFinalFloor(floor: number): boolean {
  return floor === FINAL_FLOOR;
}

/** Grid grows with depth so floor 40 is spatially nothing like floor 1. */
export function gridSizeForFloor(floor: number): number {
  if (floor >= 21) return 7;
  if (floor >= 11) return 6;
  return 5;
}

/**
 * Generate a dungeon floor. Pass a seeded `Rng` (e.g. `rngForFloor(runSeed,
 * floor)`) for fully deterministic output — same seed + floor always yields
 * the same map, which powers daily runs, replays, and balance tests.
 * Shops are town-only; the dungeon is pure delve (no merchant rooms).
 */
export function generateDungeon(floor: number, rng?: Rng): DungeonState {
  for (let attempt = 0; attempt < 30; attempt++) {
    const dungeon = attemptFloor(floor, rng, attempt > 20);
    if (dungeon) return dungeon;
  }
  // Practically unreachable: the no-walls fallback always connects.
  return attemptFloor(floor, rng, true) as DungeonState;
}

interface Helpers {
  pick: <T>(arr: T[]) => T;
  ch: (p: number) => boolean;
  rInt: (min: number, max: number) => number;
  shuf: <T>(arr: T[]) => T[];
  roll: () => number;
}

function helpersFor(rng?: Rng): Helpers {
  return {
    pick: <T,>(arr: T[]): T => (rng ? rngPick(rng, arr) : pickRandom(arr)),
    ch: (p: number): boolean => (rng ? rngChance(rng, p) : chance(p)),
    rInt: (min: number, max: number): number => (rng ? rngInt(rng, min, max) : randomInt(min, max)),
    shuf: <T,>(arr: T[]): T[] => (rng ? rngShuffle(rng, arr) : shuffleArray(arr)),
    roll: (): number => (rng ? rngFloat(rng, 0, 1) : Math.random()),
  };
}

function attemptFloor(floor: number, rng: Rng | undefined, noWalls: boolean): DungeonState | null {
  const h = helpersFor(rng);
  const n = gridSizeForFloor(floor);
  const rooms: Room[][] = [];

  for (let y = 0; y < n; y++) {
    rooms[y] = [];
    for (let x = 0; x < n; x++) {
      rooms[y][x] = { type: 'empty', explored: false, x, y };
    }
  }

  rooms[0][0].type = 'start';
  rooms[0][0].explored = true;

  const bossFloor = isBossFloor(floor);
  const bossPos = { x: n - 1, y: n - 2 };
  // Traps deliberately rare (1 weight in 8) + hard-capped at 2/floor:
  // they should be occasional spikes, not a flat HP tax.
  const roomTypes: RoomType[] = ['monster', 'monster', 'monster', 'treasure', 'treasure', 'trap', 'empty', 'empty'];

  // Stairs always exist so the player can descend; on boss floors the boss
  // guards the room right before the stairs.
  rooms[n - 1][n - 1].type = 'stairs';
  if (bossFloor) {
    rooms[bossPos.y][bossPos.x].type = 'boss';
  }

  const isReserved = (x: number, y: number): boolean =>
    (x === 0 && y === 0) ||
    (x === n - 1 && y === n - 1) ||
    (bossFloor && x === bossPos.x && y === bossPos.y);

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (rooms[y][x].type !== 'empty' || isReserved(x, y)) continue;
      let t = h.pick(roomTypes);
      // Promote some monsters to elites on floor 2+
      if (t === 'monster' && floor >= 2 && h.ch(0.12)) t = 'elite';
      rooms[y][x].type = t;
    }
  }

  // Cap traps at 2/floor: convert any excess back to empty so deep floors
  // don't accumulate unavoidable damage.
  const MAX_TRAPS_PER_FLOOR = 2;
  const trapRooms: Room[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (rooms[y][x].type === 'trap') trapRooms.push(rooms[y][x]);
    }
  }
  if (trapRooms.length > MAX_TRAPS_PER_FLOOR) {
    const excess = h.shuf(trapRooms).slice(MAX_TRAPS_PER_FLOOR);
    for (const r of excess) r.type = 'empty';
  }

  const emptiesOf = (): Room[] => {
    const out: Room[] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (rooms[y][x].type === 'empty') out.push(rooms[y][x]);
      }
    }
    return out;
  };

  // Maze walls: collapsed rock makes routing a decision (dead ends, detours).
  // Connectivity is verified below; failed attempts are discarded.
  if (!noWalls) {
    const maxWalls = n === 5 ? 4 : n === 6 ? 6 : 8;
    const wallCount = Math.min(2 + Math.floor(floor / 3), maxWalls);
    const candidates = h.shuf(emptiesOf());
    for (let i = 0; i < Math.min(wallCount, candidates.length); i++) {
      candidates[i].type = 'wall';
    }
  }

  // Floor modifier: one roll per floor, shown in the header.
  // Positive variance only — no cursed floors, shrines every floor.
  const modifier = rollModifier(h.roll());

  // Endless affix: rotating pressure past the seal (floors 31+).
  const affix = rollAffix(floor, h.roll());

  if (modifier === 'swarm') {
    // Extra monsters, extra rewards.
    for (const r of h.shuf(emptiesOf()).slice(0, 2)) r.type = 'monster';
  }
  if (modifier === 'golden') {
    // Rich floor: extra treasure.
    const gold = h.shuf(emptiesOf()).slice(0, 1);
    for (const r of gold) r.type = 'treasure';
  }

  // Guarantee one shrine per floor by converting a random empty room.
  {
    const empties = emptiesOf();
    if (empties.length > 0) {
      const shrineRoom = h.pick(empties);
      shrineRoom.type = 'shrine';
      empties.splice(empties.indexOf(shrineRoom), 1);
    }
  }

  // Locked vault (floor 3+): epic-tier loot behind the key item type.
  if (floor >= 3) {
    const vaultSpots = emptiesOf();
    if (vaultSpots.length > 0) {
      h.pick(vaultSpots).type = 'vault';
    }
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const room = rooms[y][x];

      if (room.type === 'monster' || room.type === 'boss' || room.type === 'elite') {
        const enemyPool = room.type === 'boss' ? [getBossForFloor(floor, rng)] : getEnemiesForFloor(floor);
        const enemy = h.pick(enemyPool);
        room.enemy = scaleEnemy(enemy, floor, room.type === 'elite');
      }

      if (room.type === 'treasure') {
        // Occasionally a key instead of loot — the vault economy.
        room.item = floor >= 3 && h.ch(0.12) ? ITEMS['dungeon_key'] : getRandomLoot(floor, rng);
      }

      if (room.type === 'vault') {
        room.item = getVaultLoot(floor, h.pick, h.roll);
      }

      if (room.type === 'trap') {
        room.trapDamage = h.rInt(5, 15) + floor * 2;
      }
    }
  }

  // Every attempt must keep start -> stairs (+ boss) reachable.
  const targets = [{ x: n - 1, y: n - 1 }];
  if (bossFloor) targets.push(bossPos);
  if (!allReachable(rooms, n, targets)) return null;

  // Endless affixes bend enemy stats (applied in scaleEnemyWithAffix).
  if (affix !== 'none') {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const room = rooms[y][x];
        if (room.enemy && (room.type === 'monster' || room.type === 'elite' || room.type === 'boss')) {
          room.enemy = applyAffix(room.enemy, affix);
        }
      }
    }
  }

  return { floor, rooms, playerPos: { x: 0, y: 0 }, gridSize: n, modifier, affix };
}

function rollModifier(roll: number): FloorModifier {
  if (roll < 0.7) return 'none';
  if (roll < 0.85) return 'golden';
  return 'swarm';
}

/** Endless rotation: vampiric (HP+), arcane (ATK+), ironclad (DEF+) in 5-floor bands. */
export function rollAffix(floor: number, roll: number): FloorAffix {
  if (floor <= FINAL_FLOOR) return 'none';
  const band = Math.floor((floor - FINAL_FLOOR - 1) / 5) % 3;
  if (band === 0) return roll < 0.7 ? 'vampiric' : 'none';
  if (band === 1) return roll < 0.7 ? 'arcane' : 'none';
  return roll < 0.7 ? 'ironclad' : 'none';
}

/** Pure affix application — exported for tests/sim. */
export function applyAffix(enemy: Enemy, affix: FloorAffix): Enemy {
  if (affix === 'none') return enemy;
  if (affix === 'vampiric') {
    const hp = Math.floor(enemy.stats.hp * 1.25);
    return { ...enemy, stats: { ...enemy.stats, hp, maxHp: Math.floor(enemy.stats.maxHp * 1.25) } };
  }
  if (affix === 'arcane') {
    return { ...enemy, attack: Math.floor(enemy.attack * 1.15) };
  }
  // ironclad
  return { ...enemy, defense: Math.floor(enemy.defense * 1.3) + 2 };
}

/** BFS over non-wall cells from (0,0). Exported for tests. */
export function allReachable(
  rooms: Room[][],
  gridSize: number,
  targets: { x: number; y: number }[],
): boolean {
  const seen = new Set<string>(['0,0']);
  const queue: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  while (queue.length > 0) {
    const cur = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
      if (rooms[ny][nx].type === 'wall') continue;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return targets.every((t) => seen.has(`${t.x},${t.y}`));
}

/**
 * Tier-windowed pool: low tiers retire as floors advance, so descent keeps
 * showing new encounters instead of scaled slimes forever.
 * Exported for the headless balance simulator.
 */
export function getEnemiesForFloor(floor: number) {
  const pool = ENEMIES.filter(
    (e) => floor >= e.minFloor && (e.maxFloor === undefined || floor <= e.maxFloor),
  );
  return pool.length > 0 ? pool : ENEMIES.slice(-3);
}

/** Authored boss spine — one boss per tier, so difficulty is monotonic. */
const BOSS_BY_FLOOR: Record<number, string> = {
  5: 'goblin_king',
  10: 'necromancer',
  15: 'flame_tyrant',
  20: 'dragon_lord',
  25: 'void_reaver',
  30: 'demon_king',
};

/** Endless rotation once the seal breaks: only the endgame terrors. */
const ENDLESS_BOSSES = ['dragon_lord', 'void_reaver', 'demon_king'];

/** Exact boss for a boss floor (base stats — the caller scales). */
export function getBossForFloor(floor: number, rng?: Rng): Enemy {
  const id = BOSS_BY_FLOOR[floor];
  if (id) {
    const boss = BOSS_ENEMIES.find((b) => b.id === id);
    if (boss) return boss;
  }
  const pool = ENDLESS_BOSSES.map((bid) => BOSS_ENEMIES.find((b) => b.id === bid)!).filter(Boolean);
  const list = pool.length > 0 ? pool : BOSS_ENEMIES;
  return rng ? rngPick(rng, list) : pickRandom(list);
}

/** Exported for the headless balance simulator. */
export function scaleEnemy(enemy: Enemy, floor: number, isElite = false): Enemy {
  const scaling = 1 + (floor - 1) * 0.15;
  const eliteHp = isElite ? 1.5 : 1;
  const eliteAtk = isElite ? 1.3 : 1;
  const eliteReward = isElite ? 2 : 1;
  return {
    ...enemy,
    name: isElite ? `Elite ${enemy.name}` : enemy.name,
    isElite,
    stats: {
      ...enemy.stats,
      hp: Math.floor(enemy.stats.hp * scaling * eliteHp),
      maxHp: Math.floor(enemy.stats.maxHp * scaling * eliteHp),
    },
    attack: Math.floor(enemy.attack * scaling * eliteAtk),
    defense: Math.floor(enemy.defense * scaling),
    expReward: Math.floor(enemy.expReward * scaling * eliteReward),
    goldReward: Math.floor(enemy.goldReward * scaling * eliteReward),
  };
}

/** Exported for the headless balance simulator. */
export function getRandomLoot(floor: number, rng?: Rng): Item {
  const allItems = Object.values(ITEMS);
  const lootPool = allItems.filter((item) => {
    if (item.type === 'potion') return true;
    if (item.effect) return true;
    if (item.rarity === 'common') return true;
    if (item.rarity === 'uncommon' && floor >= 2) return true;
    if (item.rarity === 'rare' && floor >= 4) return true;
    if (item.rarity === 'epic' && floor >= 7) return true;
    return false;
  });
  const pool = lootPool.length > 0 ? lootPool : [ITEMS.slime_gel];
  return rng ? rngPick(rng, pool) : pickRandom(pool);
}

/** Vault loot: rare+ gear only — the key must always feel worth it. */
export function getVaultLoot(floor: number, pick: <T>(arr: T[]) => T, roll: () => number): Item {
  const gear = Object.values(ITEMS).filter((i) => i.type === 'weapon' || i.type === 'armor');
  const epics = gear.filter((i) => i.rarity === 'epic');
  const rares = gear.filter((i) => i.rarity === 'rare');
  if (floor >= 7 && epics.length > 0 && rares.length > 0) {
    return roll() < 0.4 ? pick(epics) : pick(rares);
  }
  const pool = [...rares, ...epics];
  return pool.length > 0 ? pick(pool) : ITEMS['plate_armor'];
}

export function getAdjacentRooms(dungeon: DungeonState) {
  const { playerPos, gridSize } = dungeon;
  const { x, y } = playerPos;
  return {
    up: y > 0,
    down: y < gridSize - 1,
    left: x > 0,
    right: x < gridSize - 1,
  };
}
