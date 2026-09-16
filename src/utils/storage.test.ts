import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../game/data/items';
import { loadGame, saveGame, SAVE_VERSION, type SaveData } from './storage';

function installMemoryStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
}

const KEY = 'terminal_rpg_save';

function basePlayer(): SaveData['player'] {
  return {
    name: 'Tester',
    class: 'warrior',
    level: 3,
    exp: 0,
    expToNext: 100,
    stats: { str: 20, dex: 12, int: 6, hp: 150, maxHp: 150, mp: 34, maxMp: 34, def: 9 },
    gold: 120,
    inventory: [{ item: ITEMS['hp_potion_s'], quantity: 2 }],
    equipment: { weapon: ITEMS['iron_sword'], armor: null, accessory: null },
    floor: 4,
    statPoints: 6,
    relics: ['whetstone'],
  };
}

function baseSave(): SaveData {
  return {
    version: SAVE_VERSION,
    player: basePlayer(),
    dungeon: null,
    quests: [],
    lastSave: new Date().toISOString(),
    stats: { bestFloor: 4, bossesKilled: 0, runsStarted: 1 },
    runSeed: 123,
    dailyKey: null,
  };
}

describe('save system', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('round-trips id-based slots and equipment', () => {
    expect(saveGame(baseSave())).toBe(true);
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    // On disk: ids, not shared object references.
    expect(raw.player.inventory).toEqual([{ itemId: 'hp_potion_s', quantity: 2 }]);
    expect(raw.player.equipment).toEqual({ weapon: 'iron_sword', armor: null, accessory: null });
    expect(raw.version).toBe(SAVE_VERSION);
    expect(typeof raw.hash).toBe('string');

    const loaded = loadGame()!;
    expect(loaded.player.inventory[0].item.id).toBe('hp_potion_s');
    expect(loaded.player.equipment.weapon?.id).toBe('iron_sword');
    expect(loaded.player.relics).toEqual(['whetstone']);
    expect(loaded.runSeed).toBe(123);
    expect(loaded.tampered).toBe(false);
  });

  it('flags hand-edited saves but still loads them', () => {
    saveGame(baseSave());
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    raw.player.gold = 999999;
    localStorage.setItem(KEY, JSON.stringify(raw));
    const loaded = loadGame()!;
    expect(loaded.tampered).toBe(true);
    expect(loaded.player.gold).toBe(999999);
  });

  it('migrates a v1 object-form save to id form with relics backfilled', () => {
    const legacy = {
      version: 1,
      player: {
        ...basePlayer(),
        // v1 shape: inline Item objects, no relics array.
        relics: undefined,
        inventory: [{ item: { ...ITEMS['hp_potion_m'] }, quantity: 1 }],
        equipment: { weapon: { ...ITEMS['rusty_sword'] }, armor: null, accessory: null },
      },
      dungeon: null,
      quests: [],
      lastSave: new Date().toISOString(),
      stats: { bestFloor: 2, bossesKilled: 0, runsStarted: 1 },
    };
    localStorage.setItem(KEY, JSON.stringify(legacy));
    const loaded = loadGame()!;
    expect(loaded.version).toBe(SAVE_VERSION);
    expect(loaded.player.inventory[0].item.id).toBe('hp_potion_m');
    expect(loaded.player.equipment.weapon?.id).toBe('rusty_sword');
    expect(loaded.player.relics).toEqual([]);
  });

  it('drops unknown item ids instead of crashing', () => {
    saveGame(baseSave());
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    raw.player.inventory.push({ itemId: 'no_such_item', quantity: 5 });
    localStorage.setItem(KEY, JSON.stringify(raw));
    const fixed = JSON.parse(localStorage.getItem(KEY)!);
    expect(fixed.player.inventory).toHaveLength(2);
    // Unknown ids are dropped (the edit also trips the tamper flag — fine).
    const loaded = loadGame()!;
    expect(loaded.player.inventory).toHaveLength(1);
  });

  it('backfills missing dungeon modifiers', () => {
    const withDungeon = baseSave();
    withDungeon.dungeon = {
      floor: 2,
      rooms: [],
      playerPos: { x: 0, y: 0 },
      gridSize: 5,
      modifier: undefined as never,
    };
    saveGame(withDungeon);
    expect(loadGame()!.dungeon?.modifier).toBe('none');
  });
});
