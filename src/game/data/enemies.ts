import type { Enemy } from '../../types/game';

// Sprites use block/gradient shading (░▒▓█ ▄▀) for body mass over a
// plain outline, so shapes read at a glance. Elite/boss tiers reuse
// these base sprites with overlays from `ascii.ts` — no redraws needed.

export const ENEMIES: Enemy[] = [
  {
    id: 'slime',
    name: 'Green Slime',
    ascii: `
      .-~~~-.
     /░░░░░░░\\
    │░(o)░(o)░│
     \\░▓▓▓▓▓░/
     ▓▓▓▓▓▓▓▓▓
    ▄▓▓▓▓▓▓▓▓▄`,
    stats: { str: 4, dex: 2, int: 1, hp: 20, maxHp: 20, mp: 0, maxMp: 0, def: 0 },
    minFloor: 1,
    maxFloor: 6,
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
      /\\   /\\
     /░░\\_/░░\\
    │░(^_^)░░░│
    │░/█\\/|█\\░│
     \\░\\▓▓/░/
     ▄▓▓▓▓▓▓▄
    (_▓▓▓▓▓▓_)`,
    stats: { str: 8, dex: 6, int: 3, hp: 35, maxHp: 35, mp: 0, maxMp: 0, def: 0 },
    minFloor: 1,
    maxFloor: 8,
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
     .---.
     │X░X│
     │░O░│
    _│███│_
   │▓│░█░│▓│
   │█▓███▓█│
     │▓█▓│
    _│███│_`,
    stats: { str: 10, dex: 8, int: 2, hp: 45, maxHp: 45, mp: 0, maxMp: 0, def: 0 },
    minFloor: 2,
    maxFloor: 10,
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
        /\\
       /░░\\
      │░(*)│
      │/█\\│
      /█░█\\
     /░█░█░\\
    │▓▓█░█▓▓│
     \\_▓█▓_/`,
    stats: { str: 6, dex: 6, int: 14, hp: 40, maxHp: 40, mp: 30, maxMp: 30, def: 0 },
    minFloor: 4,
    maxFloor: 14,
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
    .═══════.
    │(o)░(o)│
    │▓▓\\_/▓▓│
    │▓/███\\▓│
    │▓\\_█_/▓│
    │▓▓█░█▓▓│
   /│▓▓█░█▓▓│\\
  (_▓▓█░█▓▓▓_)`,
    stats: { str: 16, dex: 6, int: 4, hp: 70, maxHp: 70, mp: 0, maxMp: 0, def: 0 },
    minFloor: 6,
    maxFloor: 18,
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
    /\\_/\\  /\\_/\\
   (░o.o░)(░o.o░)
    >░^░<░░>░^░<
   /│▓▓▓││▓▓▓│\\
  (_▓▓▓▓││▓▓▓▓_)`,
    stats: { str: 14, dex: 18, int: 5, hp: 55, maxHp: 55, mp: 10, maxMp: 10, def: 0 },
    minFloor: 7,
    maxFloor: 20,
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
     .-~~~-.
     │░≈░≈░│
     │(o░o)│
     │░\\_/░│
     │░≈░≈░│
    /│▓≈▓≈▓│\\
   (_▓≈▓≈▓≈▓_)`,
    stats: { str: 10, dex: 12, int: 16, hp: 60, maxHp: 60, mp: 40, maxMp: 40, def: 0 },
    minFloor: 8,
    maxFloor: 22,
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
       (░░)
      ((▓▓))
     ((▓██▓))
    │░(▓██)░│
     \\░(██)░/
      \\░▓▓░/
       \\▓▓/
        \\/`,
    stats: { str: 12, dex: 8, int: 20, hp: 50, maxHp: 50, mp: 50, maxMp: 50, def: 0 },
    minFloor: 10,
    maxFloor: 26,
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
    /\\      /\\
   /░░\\/\\/░░\\
  │░▓(o)(o)▓░│
  │░▓│▓▓│▓░│
   \\░│▓▓│░/
    \\│▓▓│/
    ▄│██│▄`,
    stats: { str: 22, dex: 14, int: 12, hp: 100, maxHp: 100, mp: 20, maxMp: 20, def: 0 },
    minFloor: 14,
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
    .═══════.
    │\\<>░▓/│
    │▓▓\\/▓▓│
    │▓▓/\\▓▓│
    │▓[██]▓│
   /│▓/░░\\▓│\\
  (_▓/░▓▓\\▓_)`,
    stats: { str: 26, dex: 16, int: 10, hp: 120, maxHp: 120, mp: 30, maxMp: 30, def: 0 },
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
    minFloor: 20,
  },
  // === VARIANTS: same art budget, different decisions =====================
  {
    id: 'armored_slime',
    name: 'Armored Slime',
    ascii: `
      .-~~~-.
     /▓▓▓▓▓▓▓\\
    │▓(o)░(o)▓│
     \\░▓███▓░/
      ▓▓▓▓▓▓▓▓▓
     ▄████████▄`,
    stats: { str: 6, dex: 1, int: 1, hp: 45, maxHp: 45, mp: 0, maxMp: 0, def: 0 },
    attack: 8,
    defense: 16,
    expReward: 20,
    goldReward: 14,
    minFloor: 3,
    maxFloor: 12,
    lootTable: [
      { itemId: 'slime_gel', chance: 0.5, quantity: 2 },
      { itemId: 'bone_shield', chance: 0.08, quantity: 1 },
    ],
    skills: [{ name: 'Harden', power: 0.5, chance: 0.25 }],
  },
  {
    id: 'volatile_slime',
    name: 'Volatile Slime',
    ascii: `
      .-~~~-.
      /░░░░░░░\\
     │░(o)░(o)░│
      \\░▒▒▒▒▒░/
      ▒▒▒▒▒▒▒▒▒
     ▄▓▓▓▓▓▓▓▓▄`,
    stats: { str: 5, dex: 4, int: 1, hp: 25, maxHp: 25, mp: 0, maxMp: 0, def: 0 },
    attack: 12,
    defense: 2,
    expReward: 26,
    goldReward: 20,
    minFloor: 5,
    maxFloor: 16,
    onDeath: { kind: 'burst', flat: 8, perFloor: 2 },
    lootTable: [
      { itemId: 'fire_bomb', chance: 0.3, quantity: 1 },
      { itemId: 'slime_gel', chance: 0.4, quantity: 1 },
    ],
    skills: [{ name: 'Swell', power: 1.4, chance: 0.3 }],
  },
  {
    id: 'brute_orc',
    name: 'Brute Orc',
    ascii: `
     .═══════.
     │(O)░(O)│
     │▓▓\\_/▓▓│
     │▓/███\\▓│
     │▓\\_█_/▓│
     │███░███│
    /│███░███│\\
   (_███░█████_)`,
    stats: { str: 24, dex: 4, int: 2, hp: 80, maxHp: 80, mp: 0, maxMp: 0, def: 0 },
    attack: 30,
    defense: 4,
    expReward: 60,
    goldReward: 45,
    minFloor: 11,
    maxFloor: 28,
    lootTable: [
      { itemId: 'iron_sword', chance: 0.12, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 0.25, quantity: 1 },
    ],
    skills: [
      { name: 'Reckless Slam', power: 2.2, chance: 0.35 },
      { name: 'War Cry', power: 0.5, chance: 0.2 },
    ],
  },
  {
    id: 'swift_wolf',
    name: 'Swift Wolf',
    ascii: `
     /\\_/\\  /\\_/\\
    (░o.o░)(░o.o░)
     >░^░<░░>░^░<
    /│▒▒▒││▒▒▒│\\
   (_▒▒▒▒││▒▒▒▒_)`,
    stats: { str: 12, dex: 26, int: 5, hp: 45, maxHp: 45, mp: 10, maxMp: 10, def: 0 },
    attack: 16,
    defense: 4,
    expReward: 58,
    goldReward: 36,
    minFloor: 9,
    maxFloor: 22,
    lootTable: [
      { itemId: 'dagger', chance: 0.12, quantity: 1 },
      { itemId: 'old_coin', chance: 0.25, quantity: 2 },
    ],
    skills: [
      { name: 'Blur Strike', power: 1.4, chance: 0.4 },
      { name: 'Howl', power: 0.8, chance: 0.2 },
    ],
  },
  {
    id: 'hex_priest',
    name: 'Hex Priest',
    ascii: `
         /\\
        /░░\\
       │░(×)│
       │/█\\│
       /█░█\\
      /░█░█░\\
     │▒▒█░█▒▒│
      \\_▒█▒_/`,
    stats: { str: 8, dex: 10, int: 18, hp: 55, maxHp: 55, mp: 40, maxMp: 40, def: 0 },
    attack: 10,
    defense: 5,
    expReward: 62,
    goldReward: 48,
    minFloor: 9,
    maxFloor: 24,
    lootTable: [
      { itemId: 'mage_robe', chance: 0.1, quantity: 1 },
      { itemId: 'mp_potion', chance: 0.4, quantity: 2 },
    ],
    skills: [
      { name: 'Hex', power: 1.4, chance: 0.45, status: { id: 'poison', dmg: 6, turns: 3 } },
      { name: 'Cinder', power: 1.8, chance: 0.3, status: { id: 'burn', dmg: 5, turns: 2 } },
    ],
  },
  {
    id: 'iron_golem',
    name: 'Iron Golem',
    ascii: `
     .═══════.
     │▓▓▓▓▓▓▓│
     │▓(░)░(░)│
     │▓▓▓█▓▓▓│
     │▓▓████▓│
    /│▓████▓│\\
   (_███████_)`,
    stats: { str: 28, dex: 2, int: 2, hp: 150, maxHp: 150, mp: 0, maxMp: 0, def: 0 },
    attack: 30,
    defense: 20,
    expReward: 130,
    goldReward: 100,
    minFloor: 16,
    lootTable: [
      { itemId: 'plate_armor', chance: 0.08, quantity: 1 },
      { itemId: 'magic_gem', chance: 0.2, quantity: 1 },
    ],
    skills: [
      { name: 'Seismic Slam', power: 2.4, chance: 0.35 },
      { name: 'Iron Wall', power: 0.5, chance: 0.2 },
    ],
  },
];

export const BOSS_ENEMIES: Enemy[] = [
  {
    id: 'goblin_king',
    name: 'Goblin King',
    ascii: `
      .-"""-.
     /_/_\\_\\
    │░(o░o)░│
    │▓▓\\_/▓▓│
    │▓_███_▓│
   /│▓\\_█_/▓│\\
  (_▓▓▓█▓▓▓▓_)`,
    stats: { str: 14, dex: 10, int: 6, hp: 120, maxHp: 120, mp: 20, maxMp: 20, def: 0 },
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
    minFloor: 5,
    maxFloor: 5,
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    ascii: `
      .-~~~-.
     /░░X░X░░\\
    │░░░≈≈≈░░│
    │░▓(___)▓│
    │░▓≈≈≈▓░│
   /│░▓≈≈≈▓░│\\
  (_│▓▓▓▓▓▓│_)`,
    stats: { str: 8, dex: 8, int: 20, hp: 100, maxHp: 100, mp: 60, maxMp: 60, def: 0 },
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
    minFloor: 10,
    maxFloor: 10,
  },
  {
    id: 'flame_tyrant',
    name: 'Flame Tyrant',
    ascii: `
        (▓▓)
       ((▓██▓))
      ((██████))
     │░(████)░│
      \\░(██)░/
       \\░██░/
      ▄▄\\██/▄▄
     (_██████_)`,
    stats: { str: 20, dex: 10, int: 22, hp: 170, maxHp: 170, mp: 60, maxMp: 60, def: 0 },
    attack: 30,
    defense: 12,
    expReward: 170,
    goldReward: 220,
    minFloor: 15,
    maxFloor: 15,
    lootTable: [
      { itemId: 'flame_blade', chance: 0.25, quantity: 1 },
      { itemId: 'mage_robe', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 1.0, quantity: 3 },
    ],
    skills: [
      { name: 'Crown of Fire', power: 3.0, chance: 0.45, status: { id: 'burn', dmg: 7, turns: 2 } },
      { name: 'Magma Burst', power: 2.2, chance: 0.3 },
      { name: 'Ashen Grasp', power: 1.4, chance: 0.25 },
    ],
  },
  {
    id: 'dragon_lord',
    name: 'Dragon Lord',
    ascii: `
    /\\        /\\
   /░░\\/\\/\\/░░\\
  │░▓(o)(o)(o)│
  │░▓│▓▓▓▓│▓░│
   \\░│▓██▓│░/
    \\│▓██▓│/
    ▄│████│▄`,
    stats: { str: 30, dex: 18, int: 16, hp: 250, maxHp: 250, mp: 40, maxMp: 40, def: 0 },
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
    minFloor: 20,
    maxFloor: 20,
  },
  {
    id: 'void_reaver',
    name: 'Void Reaver',
    ascii: `
    _/\\_______/\\_
   /░░\\▒│▒/░░\\
   │░▒\\_│_/▒░│
   │░▒/███\\▒░│
   │░/▒███▒\\░│
    \\/░▒█▒░\\/
      ▄▒█▒▄`,
    stats: { str: 32, dex: 22, int: 20, hp: 320, maxHp: 320, mp: 60, maxMp: 60, def: 0 },
    attack: 42,
    defense: 20,
    expReward: 350,
    goldReward: 420,
    minFloor: 25,
    maxFloor: 25,
    lootTable: [
      { itemId: 'shadow_blade', chance: 0.4, quantity: 1 },
      { itemId: 'sage_amulet', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 1.0, quantity: 6 },
    ],
    skills: [
      { name: 'Void Rend', power: 3.2, chance: 0.45 },
      { name: 'Soul Harvest', power: 2.4, chance: 0.3, status: { id: 'poison', dmg: 8, turns: 2 } },
      { name: 'Event Horizon', power: 4.2, chance: 0.15 },
    ],
  },
  {
    id: 'demon_king',
    name: 'Demon King',
    ascii: `
   _/\\_______/\\_
  /░░\\▓│▓/░░\\
  │░▓\\_│_/▓░│
  │░▓/███\\▓░│
  │░/▓███▓\\░│
   \\/░▓█▓░\\/
     ▄▓█▓▄`,
    stats: { str: 35, dex: 20, int: 25, hp: 400, maxHp: 400, mp: 80, maxMp: 80, def: 0 },
    attack: 45,
    defense: 22,
    expReward: 500,
    goldReward: 600,
    lootTable: [
      { itemId: 'flame_blade', chance: 0.8, quantity: 1 },
      { itemId: 'plate_armor', chance: 0.3, quantity: 1 },
      { itemId: 'crystal_staff', chance: 0.3, quantity: 1 },
      { itemId: 'hp_potion_l', chance: 1.0, quantity: 10 },
    ],
    skills: [
      { name: 'Hellfire Storm', power: 4.0, chance: 0.4 },
      { name: 'Soul Harvest', power: 3.0, chance: 0.3 },
      { name: 'Dark Barrage', power: 2.5, chance: 0.25 },
    ],
    minFloor: 30,
    maxFloor: 30,
  },
];
