import type { Room, RoomType, DungeonState, Enemy, Item } from '../../types/game';
import { ENEMIES, BOSS_ENEMIES } from '../data/enemies';
import { ITEMS, SHOP_STOCK } from '../data/items';
import { randomInt, pickRandom } from '../../utils/rng';

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
        connected: [],
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
      rooms[y][x].type = pickRandom(roomTypes);
    }
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const room = rooms[y][x];

      if (room.type === 'monster' || room.type === 'boss') {
        const enemyPool = room.type === 'boss' ? getBossesForFloor(floor) : getEnemiesForFloor(floor);
        const enemy = pickRandom(enemyPool);
        room.enemy = scaleEnemy(enemy, floor);
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

  connectRooms(rooms);

  return {
    floor,
    rooms,
    playerPos: { x: 0, y: 0 },
    gridSize: GRID_SIZE,
  };
}

function getEnemiesForFloor(floor: number) {
  const maxIndex = Math.min(ENEMIES.length, Math.max(1, Math.ceil(floor / 2)));
  return ENEMIES.slice(0, maxIndex);
}

function getBossesForFloor(floor: number) {
  // Boss index grows with depth: floor 5 -> first boss, floor 10 -> second, etc.
  const bossIndex = Math.min(BOSS_ENEMIES.length - 1, Math.max(0, Math.floor(floor / 5) - 1));
  return BOSS_ENEMIES.slice(0, bossIndex + 1);
}

function scaleEnemy(enemy: Enemy, floor: number): Enemy {
  const scaling = 1 + (floor - 1) * 0.15;
  return {
    ...enemy,
    stats: {
      ...enemy.stats,
      hp: Math.floor(enemy.stats.hp * scaling),
      maxHp: Math.floor(enemy.stats.maxHp * scaling),
    },
    attack: Math.floor(enemy.attack * scaling),
    defense: Math.floor(enemy.defense * scaling),
    expReward: Math.floor(enemy.expReward * scaling),
    goldReward: Math.floor(enemy.goldReward * scaling),
  };
}

function getRandomLoot(floor: number): Item {
  const allItems = Object.values(ITEMS);
  const lootPool = allItems.filter((item) => {
    if (item.type === 'potion') return true;
    if (item.rarity === 'common') return true;
    if (item.rarity === 'uncommon' && floor >= 2) return true;
    if (item.rarity === 'rare' && floor >= 4) return true;
    if (item.rarity === 'epic' && floor >= 7) return true;
    return false;
  });
  return pickRandom(lootPool.length > 0 ? lootPool : [ITEMS.slime_gel]);
}

function connectRooms(rooms: Room[][]) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const room = rooms[y][x];
      room.connected = [];
      if (x > 0) room.connected.push(0);
      if (x < GRID_SIZE - 1) room.connected.push(1);
      if (y > 0) room.connected.push(2);
      if (y < GRID_SIZE - 1) room.connected.push(3);
    }
  }
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
