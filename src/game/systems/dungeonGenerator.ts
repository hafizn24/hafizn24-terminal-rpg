import type { Room, RoomType, DungeonState, Enemy, Item } from '../../types/game';
import { ENEMIES, BOSS_ENEMIES } from '../data/enemies';
import { ITEMS, SHOP_STOCK } from '../data/items';
import { randomInt, pickRandom, chance } from '../../utils/rng';

const GRID_SIZE = 5;

export function generateDungeon(floor: number): DungeonState {
  const rooms: Room[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    rooms[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      rooms[y][x] = {
        type: 'empty',
        explored: false,
        x,
        y,
      };
    }
  }

  rooms[0][0].type = 'start';
  rooms[0][0].explored = true;

  const isBossFloor = floor % 5 === 0;
  const roomTypes: RoomType[] = ['monster', 'monster', 'treasure', 'trap', 'shop', 'empty', 'empty'];

  // Stairs always exist so the player can descend; on boss floors the boss
  // guards the room right before the stairs.
  rooms[GRID_SIZE - 1][GRID_SIZE - 1].type = 'stairs';
  if (isBossFloor) {
    rooms[GRID_SIZE - 1][GRID_SIZE - 2].type = 'boss';
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (rooms[y][x].type !== 'empty') continue;
      if (x === 0 && y === 0) continue;
      if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) continue;
      if (isBossFloor && x === GRID_SIZE - 1 && y === GRID_SIZE - 2) continue;
      let t = pickRandom(roomTypes);
      // Promote some monsters to elites on floor 2+
      if (t === 'monster' && floor >= 2 && chance(0.12)) t = 'elite';
      rooms[y][x].type = t;
    }
  }

  // Guarantee one shrine per floor by converting a random empty room.
  const empties: Room[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (rooms[y][x].type === 'empty') empties.push(rooms[y][x]);
    }
  }
  if (empties.length > 0) {
    pickRandom(empties).type = 'shrine';
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const room = rooms[y][x];

      if (room.type === 'monster' || room.type === 'boss' || room.type === 'elite') {
        const enemyPool = room.type === 'boss' ? getBossesForFloor(floor) : getEnemiesForFloor(floor);
        const enemy = pickRandom(enemyPool);
        room.enemy = scaleEnemy(enemy, floor, room.type === 'elite');
      }

      if (room.type === 'treasure') {
        room.item = getRandomLoot(floor);
      }

      if (room.type === 'trap') {
        room.trapDamage = randomInt(5, 15) + floor * 2;
      }

      if (room.type === 'shop') {
        const stock = pickRandom(Object.values(SHOP_STOCK));
        room.shopItems = stock.map((id) => ITEMS[id]).filter(Boolean);
      }
    }
  }

  return {
    floor,
    rooms,
    playerPos: { x: 0, y: 0 },
    gridSize: GRID_SIZE,
  };
}

function getEnemiesForFloor(floor: number) {
  // Ensure early floors see variety instead of slime-only.
  const maxIndex = Math.min(ENEMIES.length, Math.max(3, Math.ceil(floor / 2) + 1));
  return ENEMIES.slice(0, maxIndex);
}

function getBossesForFloor(floor: number) {
  // Boss index grows with depth: floor 5 -> first boss, floor 10 -> second, etc.
  const bossIndex = Math.min(BOSS_ENEMIES.length - 1, Math.max(0, Math.floor(floor / 5) - 1));
  return BOSS_ENEMIES.slice(0, bossIndex + 1);
}

function scaleEnemy(enemy: Enemy, floor: number, isElite = false): Enemy {
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

function getRandomLoot(floor: number): Item {
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
  return pickRandom(lootPool.length > 0 ? lootPool : [ITEMS.slime_gel]);
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
