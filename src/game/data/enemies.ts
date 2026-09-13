import type { Enemy } from '../../types/game';

export const ENEMIES: Enemy[] = [
  {
    id: 'slime',
    name: 'Green Slime',
    ascii: `
   .---.
   | o |
   '---'`,
    stats: { str: 4, dex: 2, int: 1, hp: 20, maxHp: 20, mp: 0, maxMp: 0 },
    attack: 5,
    defense: 1,
    expReward: 8,
    goldReward: 5,
    lootTable: [
      { itemId: 'slime_gel', chance: 0.5, quantity: 1 },
      { itemId: 'hp_potion_s', chance: 0.2, quantity: 1 },
    ],
    skills: [],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    ascii: `
   .-===-.
   | g   |
   |  X  |
  / \\   / \\
  '---'---'`,
    stats: { str: 8, dex: 6, int: 3, hp: 35, maxHp: 35, mp: 0, maxMp: 0 },
    attack: 10,
    defense: 3,
    expReward: 15,
    goldReward: 12,
    lootTable: [
      { itemId: 'rusty_sword', chance: 0.15, quantity: 1 },
      { itemId: 'leather_armor', chance: 0.1, quantity: 1 },
      { itemId: 'hp_potion_s', chance: 0.3, quantity: 1 },
    ],
    skills: [{ name: 'Scratch', power: 1.2, chance: 0.3 }],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    ascii: `
   .===.
   | # |
   | # |
   | # |
  /#   #\\`,
    stats: { str: 10, dex: 8, int: 2, hp: 45, maxHp: 45, mp: 0, maxMp: 0 },
    attack: 14,
    defense: 5,
    expReward: 22,
    goldReward: 18,
    lootTable: [
      { itemId: 'bone_sword', chance: 0.12, quantity: 1 },
      { itemId: 'bone_shield', chance: 0.08, quantity: 1 },
      { itemId: 'hp_potion_m', chance: 0.25, quantity: 1 },
    ],
    skills: [{ name: 'Bone Crush', power: 1.5, chance: 0.25 }],
  },
  {
    id: 'dark_mage',
    name: 'Dark Mage',
    ascii: `
    .===.
    | ? |
    | @ |
    | @ |
   /@   @\\`,
    stats: { str: 6, dex: 6, int: 14, hp: 40, maxHp: 40, mp: 30, maxMp: 30 },
    attack: 8,
    defense: 4,
    expReward: 30,
    goldReward: 25,
    lootTable: [
      { itemId: 'magic_staff', chance: 0.1, quantity: 1 },
      { itemId: 'mage_robe', chance: 0.08, quantity: 1 },
      { itemId: 'mp_potion', chance: 0.3, quantity: 1 },
    ],
    skills: [
      { name: 'Shadow Bolt', power: 2.0, chance: 0.4 },
      { name: 'Drain Life', power: 1.0, chance: 0.2, status: { id: 'poison', dmg: 4, turns: 2 } },
    ],
  },
  {
    id: 'orc',
    name: 'Orc Warrior',
    ascii: `
  .=====.
  |  X  |
  |  X  |
  |  _  |
 / \\   / \\`,
    stats: { str: 16, dex: 6, int: 4, hp: 70, maxHp: 70, mp: 0, maxMp: 0 },
    attack: 20,
    defense: 8,
    expReward: 40,
    goldReward: 35,
    lootTable: [
      { itemId: 'iron_sword', chance: 0.12, quantity: 1 },
      { itemId: 'chain_mail', chance: 0.08, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 0.2, quantity: 1 },
    ],
    skills: [
      { name: 'Cleave', power: 1.8, chance: 0.3 },
      { name: 'War Cry', power: 0.5, chance: 0.2 },
    ],
  },
  {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    ascii: `
   /\\_/\\
  ( o.o )
   > ^ <
  /|   |\\
 (_|   |_)`,
    stats: { str: 14, dex: 18, int: 5, hp: 55, maxHp: 55, mp: 10, maxMp: 10 },
    attack: 18,
    defense: 6,
    expReward: 45,
    goldReward: 30,
    lootTable: [
      { itemId: 'dagger', chance: 0.15, quantity: 1 },
      { itemId: 'hp_potion_m', chance: 0.3, quantity: 1 },
      { itemId: 'old_coin', chance: 0.2, quantity: 2 },
    ],
    skills: [
      { name: 'Fang Strike', power: 1.6, chance: 0.35 },
      { name: 'Howl', power: 0.8, chance: 0.2 },
    ],
  },
  {
    id: 'wraith',
    name: 'Wraith',
    ascii: `
    .-===-.
    | ~~~ |
    |  O  |
    | ~~~ |
   / ~~~ ~ \\
    '-----'`,
    stats: { str: 10, dex: 12, int: 16, hp: 60, maxHp: 60, mp: 40, maxMp: 40 },
    attack: 12,
    defense: 3,
    expReward: 55,
    goldReward: 40,
    lootTable: [
      { itemId: 'magic_staff', chance: 0.12, quantity: 1 },
      { itemId: 'mage_robe', chance: 0.1, quantity: 1 },
      { itemId: 'mp_potion', chance: 0.4, quantity: 2 },
    ],
    skills: [
      { name: 'Life Drain', power: 1.8, chance: 0.4, status: { id: 'poison', dmg: 5, turns: 2 } },
      { name: 'Soul Rend', power: 2.2, chance: 0.25 },
    ],
  },
  {
    id: 'flame_elemental',
    name: 'Flame Elemental',
    ascii: `
      /\\
     /  \\
    / @@ \\
   |  @@  |
    \\ @@ /
     \\  /
      \\/`,
    stats: { str: 12, dex: 8, int: 20, hp: 50, maxHp: 50, mp: 50, maxMp: 50 },
    attack: 10,
    defense: 5,
    expReward: 65,
    goldReward: 45,
    lootTable: [
      { itemId: 'magic_gem', chance: 0.2, quantity: 1 },
      { itemId: 'mp_potion', chance: 0.5, quantity: 2 },
      { itemId: 'flame_blade', chance: 0.03, quantity: 1 },
    ],
    skills: [
      { name: 'Fireball', power: 2.5, chance: 0.45, status: { id: 'burn', dmg: 6, turns: 2 } },
      { name: 'Flame Wave', power: 1.8, chance: 0.3 },
    ],
  },
  {
    id: 'dragon_wyrmling',
    name: 'Dragon Wyrmling',
    ascii: `
    /\\  /\\
   /  \\/  \\
  |  ____  |
  | |    | |
   \\|    |/
    \\____/`,
    stats: { str: 22, dex: 14, int: 12, hp: 100, maxHp: 100, mp: 20, maxMp: 20 },
    attack: 28,
    defense: 12,
    expReward: 90,
    goldReward: 70,
    lootTable: [
      { itemId: 'steel_sword', chance: 0.1, quantity: 1 },
      { itemId: 'plate_armor', chance: 0.05, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 0.5, quantity: 3 },
    ],
    skills: [
      { name: 'Fire Breath', power: 2.8, chance: 0.4 },
      { name: 'Tail Whip', power: 1.5, chance: 0.3 },
    ],
  },
  {
    id: 'demon_knight',
    name: 'Demon Knight',
    ascii: `
   .=====.
   | <>  |
   |  X  |
   | []  |
  / \\  / \\`,
    stats: { str: 26, dex: 16, int: 10, hp: 120, maxHp: 120, mp: 30, maxMp: 30 },
    attack: 32,
    defense: 15,
    expReward: 110,
    goldReward: 85,
    lootTable: [
      { itemId: 'steel_sword', chance: 0.15, quantity: 1 },
      { itemId: 'plate_armor', chance: 0.08, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 0.4, quantity: 2 },
    ],
    skills: [
      { name: 'Hellfire Slash', power: 3.0, chance: 0.35 },
      { name: 'Dark Shield', power: 0.5, chance: 0.2 },
    ],
  },
];

export const BOSS_ENEMIES: Enemy[] = [
  {
    id: 'goblin_king',
    name: 'Goblin King',
    ascii: `
  .=======.
  |  ___  |
  | |   | |
  |  X X  |
  |  ===  |
 / \\     / \\`,
    stats: { str: 14, dex: 10, int: 6, hp: 120, maxHp: 120, mp: 20, maxMp: 20 },
    attack: 22,
    defense: 10,
    expReward: 80,
    goldReward: 100,
    lootTable: [
      { itemId: 'iron_sword', chance: 0.5, quantity: 1 },
      { itemId: 'chain_mail', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 0.8, quantity: 2 },
    ],
    skills: [
      { name: 'Royal Smash', power: 2.0, chance: 0.4 },
      { name: 'Summon Guard', power: 1.0, chance: 0.25 },
    ],
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    ascii: `
  .=======.
  |  ___  |
  | | X | |
  |  ~~~  |
  |  ~~~  |
 / ~~~~~ \\`,
    stats: { str: 8, dex: 8, int: 20, hp: 100, maxHp: 100, mp: 60, maxMp: 60 },
    attack: 12,
    defense: 6,
    expReward: 120,
    goldReward: 150,
    lootTable: [
      { itemId: 'magic_staff', chance: 0.4, quantity: 1 },
      { itemId: 'mage_robe', chance: 0.3, quantity: 1 },
      { itemId: 'mp_potion', chance: 0.9, quantity: 3 },
    ],
    skills: [
      { name: 'Death Ray', power: 2.5, chance: 0.45 },
      { name: 'Raise Dead', power: 1.5, chance: 0.3 },
      { name: 'Life Drain', power: 1.2, chance: 0.25 },
    ],
  },
  {
    id: 'dragon_lord',
    name: 'Dragon Lord',
    ascii: `
    /\\    /\\
   /  \\  /  \\
  |  ____  |
  | |    | |
  | |    | |
   \\|    |/
    \\____/`,
    stats: { str: 30, dex: 18, int: 16, hp: 250, maxHp: 250, mp: 40, maxMp: 40 },
    attack: 38,
    defense: 18,
    expReward: 250,
    goldReward: 300,
    lootTable: [
      { itemId: 'flame_blade', chance: 0.5, quantity: 1 },
      { itemId: 'plate_armor', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 1.0, quantity: 5 },
    ],
    skills: [
      { name: 'Inferno Breath', power: 3.5, chance: 0.5 },
      { name: 'Wing Buffet', power: 2.0, chance: 0.3 },
      { name: 'Dragon Fury', power: 4.0, chance: 0.15 },
    ],
  },
  {
    id: 'demon_king',
    name: 'Demon King',
    ascii: `
  .========.
  |  \\  /  |
  |   \\/   |
  |   /\\   |
  |  /  \\  |
 / \\/    \\/ \\`,
    stats: { str: 35, dex: 20, int: 25, hp: 400, maxHp: 400, mp: 80, maxMp: 80 },
    attack: 45,
    defense: 22,
    expReward: 500,
    goldReward: 600,
    lootTable: [
      { itemId: 'flame_blade', chance: 0.8, quantity: 1 },
      { itemId: 'plate_armor', chance: 0.5, quantity: 1 },
      { itemId: 'crystal_staff', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 1.0, quantity: 10 },
    ],
    skills: [
      { name: 'Hellfire Storm', power: 4.0, chance: 0.4 },
      { name: 'Soul Harvest', power: 3.0, chance: 0.3 },
      { name: 'Dark Barrage', power: 2.5, chance: 0.25 },
    ],
  },
];
