import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { calcDamage, calcCritChance, calcDodgeChance, chance, pickRandom } from '../../utils/rng';
import { CLASSES } from '../../game/data/classes';
import { ELITE_CROWN_ART, BOSS_AURA_TOP, BOSS_AURA_BOTTOM, isBossEnemy } from '../../game/data/ascii';
import type { Enemy, EnemySkill } from '../../types/game';
import { useKeyboard } from '../../hooks/useKeyboard';

const CLASS_ASCII: Record<string, string> = {
  warrior: `
   /│▓▓▓\\
   │░▓█▓░│
   │▓███▓│
  /│█\\░/█│\\
   │▓█░█▓│
  /│▓█░█▓│\\`,
  mage: `
     /\\
   (░▓░)
   │\\/\\│
   │░█░│
  /│▓█▓│\\
   │▓█▓│`,
  rogue: `
   /--\\
   │<█>│
   │░▓░│
  /│▓█▓│\\
   │▓█▓│
  /░▓█▓░\\`,
  cleric: `
    (+)
   \\│█│/
   ▓│█│▓
   /│█│\\
   ▓│█│▓`,
};

/**
 * Per-class skill scaling so each class feels different:
 * warrior = STR-heavy, mage = INT-heavy, rogue = DEX-flavoured, cleric = INT w/ heal.
 */
function getSkillAttack(p: { class: string; stats: { str: number; dex: number; int: number } }, weaponStr = 0, accessoryInt = 0): number {
  switch (p.class) {
    case 'warrior':
      return p.stats.str * 2 + p.stats.int * 0.3 + weaponStr;
    case 'mage':
      return p.stats.str * 0.4 + p.stats.int * 2.2 + accessoryInt;
    case 'rogue':
      return p.stats.str + p.stats.dex * 1.2 + p.stats.int * 0.3 + weaponStr;
    case 'cleric':
      return p.stats.str * 0.7 + p.stats.int * 1.6 + accessoryInt;
    default:
      return p.stats.str + p.stats.int;
  }
}

interface CombatState {
  enemyHp: number;
  enemyMaxHp: number;
  isPlayerTurn: boolean;
  combatLog: string[];
  isOver: boolean;
  won: boolean;
  shaking: boolean;
  damageNumbers: DamageNumber[];
  guarding: boolean;
  intent: EnemySkill | null;
  playerStatus: StatusEffect | null;
  enemyStatus: StatusEffect | null;
  round: number;
}

interface StatusEffect {
  id: 'burn' | 'poison';
  dmg: number;
  turns: number;
}

interface DamageNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  color: string;
}

let dmgIdCounter = 0;

function rollIntent(enemy: Enemy): EnemySkill | null {
  if (enemy.skills.length === 0) return null;
  const rolled = pickRandom(enemy.skills);
  return chance(rolled.chance) ? rolled : null;
}

export function CombatScreen() {
  const { player, updatePlayer, setScreen, setGameOver, dungeon, setDungeon } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);

  const [state, setState] = useState<CombatState>({
    enemyHp: 0,
    enemyMaxHp: 0,
    isPlayerTurn: true,
    combatLog: [],
    isOver: false,
    won: false,
    shaking: false,
    damageNumbers: [],
    guarding: false,
    intent: null,
    playerStatus: null,
    enemyStatus: null,
    round: 1,
  });
  // Combat log follows new entries only while enabled — toggling it off
  // freezes the scroll so players can read history mid-fight. It only ever
  // scrolls its own container, never the page/window.
  const [autoFollow, setAutoFollow] = useState(true);
  const combatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFollow) return;
    const el = combatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.combatLog, autoFollow]);

  const enemyRef = useRef<Enemy | null>(null);
  const playerRef = useRef(player);
  playerRef.current = player;
  const stateRef = useRef(state);
  stateRef.current = state;
  const dungeonRef = useRef(dungeon);
  dungeonRef.current = dungeon;

  useEffect(() => {
    if (dungeon) {
      const room = dungeon.rooms[dungeon.playerPos.y][dungeon.playerPos.x];
      if (room.enemy) {
        enemyRef.current = room.enemy;
        setState((s) => ({
          ...s,
          enemyHp: room.enemy!.stats.hp,
          enemyMaxHp: room.enemy!.stats.maxHp,
          intent: rollIntent(room.enemy!),
          combatLog: [
            room.enemy!.isElite ? `An ELITE ${room.enemy!.name} blocks your path!` : `A ${room.enemy!.name} appears!`,
          ],
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDamageNumber = useCallback((value: string, color: string, x: number, y: number) => {
    const id = ++dmgIdCounter;
    setState((s) => ({
      ...s,
      damageNumbers: [...s.damageNumbers, { id, value, x, y, color }],
    }));
    setTimeout(() => {
      setState((s) => ({
        ...s,
        damageNumbers: s.damageNumbers.filter((d) => d.id !== id),
      }));
    }, 1000);
  }, []);

  const triggerShake = useCallback(() => {
    setState((s) => ({ ...s, shaking: true }));
    setTimeout(() => setState((s) => ({ ...s, shaking: false })), 300);
  }, []);

  const getPlayerAttack = useCallback(() => {
    const p = playerRef.current!;
    return p.stats.str + (p.equipment.weapon?.statBonus?.str || 0) + (p.equipment.accessory?.statBonus?.str || 0);
  }, []);

  const getPlayerDef = useCallback(() => {
    const p = playerRef.current!;
    return (
      Math.floor((p.equipment.armor?.statBonus?.hp || 0) / 5) +
      Math.floor((p.equipment.accessory?.statBonus?.hp || 0) / 5)
    );
  }, []);

  const getCritChance = useCallback(() => {
    const p = playerRef.current!;
    const base = calcCritChance(p.stats.dex + (p.equipment.accessory?.statBonus?.dex || 0));
    if (p.equipment.accessory?.id === 'lucky_charm') return Math.min(0.5, base + 0.05);
    return base;
  }, []);

  const applyStatusTick = useCallback(
    (side: 'player' | 'enemy'): boolean => {
      // Returns true if the tick killed someone. Applies one tick immediately.
      if (side === 'player') {
        const st = stateRef.current.playerStatus;
        const p = playerRef.current;
        if (!st || !p) return false;
        const newHp = Math.max(0, p.stats.hp - st.dmg);
        updatePlayer({ stats: { ...p.stats, hp: newHp } });
        addDamageNumber(`-${st.dmg} ${st.id}`, '#ff8800', 45, 70);
        addLog(`${st.id === 'burn' ? 'Burn' : 'Poison'} deals ${st.dmg} damage to you!`, 'danger');
        const remaining = st.turns - 1;
        setState((s) => ({
          ...s,
          playerStatus: remaining > 0 ? { ...st, turns: remaining } : null,
          combatLog: [...s.combatLog, `${st.id === 'burn' ? 'Burn' : 'Poison'}: -${st.dmg} HP`],
        }));
        if (newHp <= 0) {
          setGameOver(`Succumbed to ${st.id} against ${enemyRef.current?.name ?? 'the enemy'}.`);
          setState((s) => ({ ...s, isOver: true, won: false }));
          return true;
        }
        return false;
      }
      const st = stateRef.current.enemyStatus;
      if (!st) return false;
      const newHp = Math.max(0, stateRef.current.enemyHp - st.dmg);
      addDamageNumber(`-${st.dmg} ${st.id}`, '#ff8800', 55, 25);
      const remaining = st.turns - 1;
      const killed = newHp <= 0;
      setState((s) => ({
        ...s,
        enemyHp: newHp,
        enemyStatus: remaining > 0 && !killed ? { ...st, turns: remaining } : null,
        combatLog: [...s.combatLog, `Enemy ${st.id}: -${st.dmg} HP`],
      }));
      if (killed) {
        setTimeout(() => handleVictory(), 300);
        return true;
      }
      return false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [addDamageNumber, addLog, updatePlayer, setGameOver]
  );

  const enemyTurn = useCallback(() => {
    const s = stateRef.current;
    if (s.isOver) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    if (!p || !e) return;

    // Enemy status ticks first.
    if (s.enemyStatus) {
      const killed = applyStatusTick('enemy');
      if (killed) return;
      if (stateRef.current.enemyHp <= 0) return;
    }

    const intent = stateRef.current.intent;
    const guarding = stateRef.current.guarding;
    const pDex = p.stats.dex + (p.equipment.accessory?.statBonus?.dex || 0);
    const dodgeChance = calcDodgeChance(pDex, e.stats.dex, guarding);

    // DEX dodge — avoids the hit entirely (guard boosts it).
    if (chance(dodgeChance)) {
      const msg = guarding ? 'Dodged behind your guard! No damage!' : 'Dodged! No damage!';
      addLog(msg, 'combat');
      addDamageNumber('MISS', '#00ffff', 50, 65);
      setState((prev) => ({
        ...prev,
        combatLog: [...prev.combatLog, msg],
        isPlayerTurn: true,
        guarding: false,
        intent: rollIntent(e),
        round: prev.round + 1,
      }));
      return;
    }

    let dmg: number;
    let logMsg: string;
    let statusToApply: StatusEffect | null = null;

    if (intent) {
      dmg = calcDamage(Math.floor(e.attack * intent.power), getPlayerDef());
      logMsg = `${e.name} uses ${intent.name}! ${dmg} damage!`;
      if (intent.status) statusToApply = { ...intent.status };
    } else {
      dmg = calcDamage(e.attack, getPlayerDef());
      logMsg = `${e.name} attacks for ${dmg} damage.`;
    }

    if (guarding) {
      dmg = Math.max(1, Math.floor(dmg / 2));
      logMsg += ' (Guarded!)';
    }

    const newHp = Math.max(0, p.stats.hp - dmg);
    // Guard restores a little MP.
    const newMp = guarding
      ? Math.min(p.stats.maxMp, p.stats.mp + 5)
      : p.stats.mp;
    updatePlayer({ stats: { ...p.stats, hp: newHp, mp: newMp } });

    addLog(logMsg, 'danger');
    triggerShake();
    addDamageNumber(`-${dmg}`, '#ff0040', 50 + Math.random() * 30, 60 + Math.random() * 20);

    if (newHp <= 0) {
      setGameOver(`Defeated by ${e.name} on floor ${dungeonRef.current?.floor || 1}.`);
      setState((prev) => ({
        ...prev,
        combatLog: [...prev.combatLog, logMsg, 'You have been slain!'],
        isOver: true,
        won: false,
        guarding: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      combatLog: [...prev.combatLog, logMsg],
      isPlayerTurn: true,
      guarding: false,
      intent: rollIntent(e),
      round: prev.round + 1,
      playerStatus: statusToApply ?? prev.playerStatus,
    }));
    if (statusToApply) {
      addLog(`You are afflicted with ${statusToApply.id}!`, 'danger');
    }
  }, [addDamageNumber, addLog, applyStatusTick, getPlayerDef, setGameOver, triggerShake, updatePlayer]);

  const checkVictory = useCallback(
    (newEnemyHp: number) => {
      if (newEnemyHp <= 0) {
        setTimeout(() => handleVictory(), 300);
        return true;
      }
      setTimeout(enemyTurn, 800);
      return false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [enemyTurn]
  );

  const handleAttack = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    if (!p || !e) return;

    const crit = chance(getCritChance());
    const dmg = calcDamage(getPlayerAttack(), e.defense);
    const finalDmg = crit ? Math.floor(dmg * 2) : dmg;
    const newEnemyHp = Math.max(0, s.enemyHp - finalDmg);

    const logMsg = crit
      ? `CRITICAL HIT! You deal ${finalDmg} damage!`
      : `You attack for ${finalDmg} damage.`;

    addDamageNumber(crit ? `CRIT -${finalDmg}` : `-${finalDmg}`, crit ? '#ffd700' : '#00ff41', 50 + Math.random() * 30, 20 + Math.random() * 20);
    if (crit) triggerShake();

    setState((prev) => ({
      ...prev,
      enemyHp: newEnemyHp,
      isPlayerTurn: false,
      combatLog: [...prev.combatLog, logMsg],
    }));
    addLog(logMsg, crit ? 'loot' : 'combat');
    checkVictory(newEnemyHp);
  }, [addDamageNumber, addLog, applyStatusTick, checkVictory, getCritChance, getPlayerAttack, triggerShake]);

  const handleSkill = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    const classDef = CLASSES.find((c) => c.id === p.class);
    if (!classDef || !p || !e) return;

    if (p.stats.mp < classDef.skill.mpCost) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'Not enough MP! Guard to recover 5 MP.'] }));
      return;
    }

    const atk = getSkillAttack(
      p,
      p.equipment.weapon?.statBonus?.str || 0,
      p.equipment.accessory?.statBonus?.int || 0
    );
    const isRogueBonus = p.class === 'rogue' && chance(0.25);
    const base = calcDamage(Math.floor((atk * classDef.skill.power) / 2), e.defense);
    const dmg = isRogueBonus ? base * 2 : base;
    const newEnemyHp = Math.max(0, s.enemyHp - dmg);

    let newStats = { ...p.stats, mp: p.stats.mp - classDef.skill.mpCost };
    let logMsg = `${classDef.skill.name}! Deals ${dmg} damage!${isRogueBonus ? ' SNEAK BONUS x2!' : ''}`;
    if (p.class === 'cleric') {
      const heal = 2 * p.stats.int;
      newStats = { ...newStats, hp: Math.min(newStats.maxHp, newStats.hp + heal) };
      logMsg += ` Healed ${heal} HP.`;
      addDamageNumber(`+${heal}`, '#00ff41', 40, 75);
    }
    updatePlayer({ stats: newStats });

    addDamageNumber(`-${dmg}`, '#00ffff', 50 + Math.random() * 30, 20 + Math.random() * 20);
    triggerShake();

    setState((prev) => ({
      ...prev,
      enemyHp: newEnemyHp,
      isPlayerTurn: false,
      combatLog: [...prev.combatLog, logMsg],
    }));
    addLog(logMsg, 'combat');
    checkVictory(newEnemyHp);
  }, [addDamageNumber, addLog, applyStatusTick, checkVictory, triggerShake, updatePlayer]);

  const consumeOne = useCallback(
    (itemId: string): boolean => {
      const p = playerRef.current;
      if (!p) return false;
      const newInv = p.inventory
        .map((slot) => (slot.item.id === itemId ? { ...slot, quantity: slot.quantity - 1 } : slot))
        .filter((slot) => slot.quantity > 0);
      updatePlayer({ inventory: newInv });
      return true;
    },
    [updatePlayer]
  );

  const handleUseItemId = useCallback(
    (itemId: string) => {
      const s = stateRef.current;
      if (!s.isPlayerTurn || s.isOver) return;
      if (applyStatusTick('player')) return;
      const p = playerRef.current!;
      const slot = p.inventory.find((sl) => sl.item.id === itemId && sl.quantity > 0);
      if (!slot) {
        setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'None left!'] }));
        return;
      }
      const item = slot.item;

      if (item.effect === 'smoke') {
        consumeOne(itemId);
        const msg = `Used ${item.name}. Vanished in smoke!`;
        setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, msg], isOver: true, won: false }));
        addLog('Escaped in smoke!', 'system');
        setTimeout(() => setScreen('dungeon'), 800);
        return;
      }

      if (item.effect === 'bomb') {
        consumeOne(itemId);
        const floor = dungeonRef.current?.floor ?? 1;
        const dmg = item.effectPower ?? 25;
        const total = dmg + floor * 3;
        const newEnemyHp = Math.max(0, s.enemyHp - total);
        const msg = `Threw ${item.name}! ${total} damage!`;
        addDamageNumber(`-${total}`, '#ff8800', 55, 25);
        triggerShake();
        setState((prev) => ({
          ...prev,
          enemyHp: newEnemyHp,
          isPlayerTurn: false,
          combatLog: [...prev.combatLog, msg],
        }));
        addLog(msg, 'combat');
        checkVictory(newEnemyHp);
        return;
      }

      if (item.healAmount && p.stats.hp >= p.stats.maxHp) {
        setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'HP already full! Potion not used.'] }));
        return;
      }
      if (item.mpRestoreAmount && !item.healAmount && p.stats.mp >= p.stats.maxMp) {
        setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'MP already full! Potion not used.'] }));
        return;
      }

      const newStats = { ...p.stats };
      let logMsg = '';
      if (item.healAmount) {
        const healed = Math.min(item.healAmount, newStats.maxHp - newStats.hp);
        newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.healAmount);
        logMsg = `Used ${item.name}. Healed ${healed} HP.`;
        addDamageNumber(`+${healed}`, '#00ff41', 45, 75);
      } else if (item.mpRestoreAmount) {
        const restored = Math.min(item.mpRestoreAmount, newStats.maxMp - newStats.mp);
        newStats.mp = Math.min(newStats.maxMp, newStats.mp + item.mpRestoreAmount);
        logMsg = `Used ${item.name}. Restored ${restored} MP.`;
        addDamageNumber(`+${restored}`, '#00ffff', 45, 75);
      } else {
        return;
      }

      consumeOne(itemId);
      updatePlayer({ stats: newStats });
      setState((prev) => ({ ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, logMsg] }));
      addLog(logMsg, 'loot');
      setTimeout(enemyTurn, 800);
    },
    [addDamageNumber, addLog, applyStatusTick, checkVictory, consumeOne, enemyTurn, setScreen, triggerShake, updatePlayer]
  );

  const handleQuickPotion = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    // Prefer an HP potion when hurt, else MP potion.
    const hpPotion = p.inventory.find(
      (sl) => sl.item.healAmount && sl.quantity > 0 && p.stats.hp < p.stats.maxHp
    );
    if (hpPotion) {
      handleUseItemId(hpPotion.item.id);
      return;
    }
    const mpPotion = p.inventory.find(
      (sl) => sl.item.mpRestoreAmount && !sl.item.healAmount && sl.quantity > 0 && p.stats.mp < p.stats.maxMp
    );
    if (mpPotion) {
      handleUseItemId(mpPotion.item.id);
      return;
    }
    const anyPotion = p.inventory.find(
      (sl) => sl.item.type === 'potion' && sl.quantity > 0
    );
    if (anyPotion) handleUseItemId(anyPotion.item.id);
    else
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'No usable potion! Try Guard or Run.'] }));
  }, [handleUseItemId]);

  const handleGuard = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const msg = 'You brace! Next hit halved, +15% dodge, +5 MP.';
    setState((prev) => ({ ...prev, guarding: true, isPlayerTurn: false, combatLog: [...prev.combatLog, msg] }));
    addLog(msg, 'combat');
    setTimeout(enemyTurn, 800);
  }, [addLog, applyStatusTick, enemyTurn]);

  const handleRun = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const p = playerRef.current!;
    const runChance = 0.4 + p.stats.dex * 0.02;
    if (chance(runChance)) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'Escaped successfully!'], isOver: true, won: false }));
      addLog('Escaped from battle!', 'system');
      setTimeout(() => setScreen('dungeon'), 1000);
    } else {
      setState((prev) => ({ ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, 'Failed to escape!'] }));
      addLog('Failed to escape!', 'danger');
      setTimeout(enemyTurn, 800);
    }
  }, [addLog, applyStatusTick, enemyTurn, setScreen]);

  const handleVictory = useCallback(() => {
    const p = playerRef.current!;
    const e = enemyRef.current!;
    if (!p || !e) return;
    const store = useGameStore.getState();

    // Loot via shared helper.
    e.lootTable.forEach((loot) => {
      if (chance(loot.chance)) {
        store.addItem(loot.itemId, loot.quantity);
        const itemName = loot.itemId.replace(/_/g, ' ');
        addLog(`Loot: ${itemName} x${loot.quantity}`, 'loot');
      }
    });
    // Elites drop extra consumables/accessories.
    if (e.isElite) {
      if (chance(0.35)) {
        const bonus = pickRandom(['fire_bomb', 'smoke_bomb', 'hp_potion_m', 'lucky_charm', 'iron_ring']);
        store.addItem(bonus, 1);
        addLog(`Elite loot: ${bonus.replace(/_/g, ' ')}!`, 'loot');
      }
    }

    const fresh = useGameStore.getState().player!;
    const goldGain = e.goldReward;
    useGameStore.getState().updatePlayer({ gold: fresh.gold + goldGain });
    const levelMsgs = useGameStore.getState().gainExp(e.expReward);
    levelMsgs.forEach((m) => addLog(m, 'loot'));

    store.updateQuestProgress('kill', e.id);
    store.updateQuestProgress('kill', 'any');
    const afterGold = useGameStore.getState().player!;
    store.updateQuestProgress('gold', 'any', afterGold.gold);

    const isBoss = dungeonRef.current
      ? dungeonRef.current.rooms[dungeonRef.current.playerPos.y][dungeonRef.current.playerPos.x].type === 'boss'
      : false;
    if (isBoss) {
      const st = useGameStore.getState().stats;
      useGameStore.setState({ stats: { ...st, bossesKilled: st.bossesKilled + 1 } });
    }

    const d = dungeonRef.current;
    if (d) {
      const newRooms = d.rooms.map((row) =>
        row.map((r) => {
          if (r.x === d.playerPos.x && r.y === d.playerPos.y) {
            return { ...r, type: 'empty' as const, enemy: undefined };
          }
          return { ...r };
        })
      );
      setDungeon({ ...d, rooms: newRooms });
    }

    const logMsg = `Victory! +${e.expReward} EXP, +${goldGain} Gold`;
    setState((prev) => ({
      ...prev,
      combatLog: [...prev.combatLog, logMsg, ...levelMsgs],
      isOver: true,
      won: true,
    }));
    addLog(logMsg, 'loot');

    // Autosave progress so a refresh doesn't wipe the run.
    setTimeout(() => {
      useGameStore.getState().save();
      setScreen('dungeon');
    }, 1500);
  }, [addLog, setDungeon, setScreen]);

  const keyMap = useMemo(
    () => ({
      '1': handleAttack,
      Enter: handleAttack,
      '2': handleSkill,
      '3': handleQuickPotion,
      '4': handleRun,
      '5': handleGuard,
      g: handleGuard,
      Escape: handleRun,
    }),
    [handleAttack, handleSkill, handleQuickPotion, handleRun, handleGuard]
  );

  useKeyboard(keyMap);

  if (!player || !enemyRef.current) return <div className="text-terminal-dim">No enemy...</div>;
  const enemy = enemyRef.current;
  const classDef = CLASSES.find((c) => c.id === player.class);
  const canAffordSkill = classDef ? player.stats.mp >= classDef.skill.mpCost : false;

  const hpPotions = player.inventory.filter((s) => s.item.healAmount && s.quantity > 0);
  const mpPotions = player.inventory.filter((s) => s.item.mpRestoreAmount && !s.item.healAmount && s.quantity > 0);
  const bombs = player.inventory.filter((s) => s.item.effect === 'bomb' && s.quantity > 0);
  const smokes = player.inventory.filter((s) => s.item.effect === 'smoke' && s.quantity > 0);
  const hpCount = hpPotions.reduce((a, s) => a + s.quantity, 0);
  const mpCount = mpPotions.reduce((a, s) => a + s.quantity, 0);
  const bombCount = bombs.reduce((a, s) => a + s.quantity, 0);
  const smokeCount = smokes.reduce((a, s) => a + s.quantity, 0);

  const playerAtk = player.stats.str + (player.equipment.weapon?.statBonus?.str || 0) + (player.equipment.accessory?.statBonus?.str || 0);
  const playerDef =
    Math.floor((player.equipment.armor?.statBonus?.hp || 0) / 5) +
    Math.floor((player.equipment.accessory?.statBonus?.hp || 0) / 5);
  const playerCrit = Math.round(
    calcCritChance(player.stats.dex + (player.equipment.accessory?.statBonus?.dex || 0)) * 100
  );
  const playerDodge = Math.round(
    calcDodgeChance(player.stats.dex + (player.equipment.accessory?.statBonus?.dex || 0), enemy.stats.dex, state.guarding) * 100
  );
  const intentBase = state.intent ? Math.floor(enemy.attack * state.intent.power) : enemy.attack;
  const intentMin = Math.max(1, Math.floor((intentBase - playerDef * 0.5) * 0.85));
  const intentMax = Math.max(1, Math.floor((intentBase - playerDef * 0.5) * 1.15));
  const boss = isBossEnemy(enemy);
  const enemyFrame = enemy.isElite
    ? 'border-terminal-yellow shadow-[0_0_12px_rgba(255,215,0,0.25)]'
    : boss
      ? 'border-terminal-red shadow-[0_0_16px_rgba(255,0,64,0.35)]'
      : 'border-terminal-dim/40';

  return (
    <div className={`flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto ${state.shaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
      <h1 className="text-terminal-red text-lg tracking-widest uppercase text-center">
        {'<< Combat >>'}
        <span className="text-terminal-dim text-xs ml-2">Round {state.round}</span>
      </h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Panel title={enemy.isElite ? `ELITE ${enemy.name}` : enemy.name} className={`flex-1 relative ${enemyFrame}`}>
          {enemy.isElite && (
            <pre
              className="text-terminal-yellow text-xs text-center whitespace-pre leading-tight font-mono"
              style={{ textShadow: '0 0 8px currentColor' }}
              aria-label="Elite crown"
            >
              {ELITE_CROWN_ART}
            </pre>
          )}
          {boss && !enemy.isElite && (
            <pre
              className="text-terminal-red text-xs text-center whitespace-pre leading-tight font-mono opacity-80"
              aria-hidden="true"
            >
              {BOSS_AURA_TOP}
            </pre>
          )}
          <pre
            className={`text-xs text-center mb-2 whitespace-pre leading-tight font-mono ${
              enemy.isElite ? 'text-terminal-yellow' : boss ? 'text-terminal-red animate-pulse-glow' : 'text-terminal-red'
            }`}
            style={{ textShadow: '0 0 8px currentColor' }}
            aria-label={`${enemy.name} artwork`}
          >
            {enemy.ascii}
          </pre>
          {boss && (
            <pre
              className="text-terminal-red text-xs text-center whitespace-pre leading-tight font-mono opacity-80"
              aria-hidden="true"
            >
              {BOSS_AURA_BOTTOM}
            </pre>
          )}
          <ProgressBar current={state.enemyHp} max={state.enemyMaxHp} label="HP" color="red" />
          <div className="mt-1 text-[10px] text-terminal-dim text-center">
            ATK {enemy.attack} · DEF {enemy.defense} · DEX {enemy.stats.dex}
          </div>
          <div className="mt-1 text-[11px] text-center" aria-live="polite">
            {state.intent ? (
              <span className="text-terminal-yellow">Intent: {state.intent.name} (~{intentMin}-{intentMax} dmg)</span>
            ) : (
              <span className="text-terminal-dim">Intent: Attack (~{intentMin}-{intentMax} dmg)</span>
            )}
            {state.enemyStatus && (
              <span className="text-terminal-red ml-2">[{state.enemyStatus.id} {state.enemyStatus.turns}t]</span>
            )}
          </div>
        </Panel>

        <div className="flex-1 flex flex-col gap-2">
          <div className="text-center text-terminal-cyan text-xs font-mono">— VS —</div>
          <Panel title={player.name} className="flex-1">
            <pre className="text-terminal-cyan text-xs text-center mb-1 whitespace-pre leading-tight" style={{ textShadow: '0 0 8px currentColor' }}>
              {CLASS_ASCII[player.class] ?? CLASS_ASCII.warrior}
            </pre>
          <div className="text-xs text-terminal-dim mb-2 text-center uppercase">
            {player.class} - Level {player.level}
            {state.guarding && <span className="text-terminal-cyan ml-2">[GUARDING]</span>}
            {state.playerStatus && (
              <span className="text-terminal-red ml-2">[{state.playerStatus.id} {state.playerStatus.turns}t]</span>
            )}
          </div>
          <div className="space-y-1">
            <ProgressBar current={player.stats.hp} max={player.stats.maxHp} label="HP" color="red" />
            <ProgressBar current={player.stats.mp} max={player.stats.maxMp} label="MP" color="cyan" />
          </div>
          <div className="mt-1 text-[10px] text-terminal-dim text-center">
            ATK {playerAtk} · DEF {playerDef} · CRIT {playerCrit}% · DODGE {playerDodge}%
          </div>
          {classDef && (
            <div className="mt-2 text-[11px] text-terminal-dim text-center">
              Skill: {classDef.skill.name} ({classDef.skill.mpCost} MP) — {classDef.skill.description}
            </div>
          )}
        </Panel>
        </div>
      </div>

      <div className="relative">
        {state.damageNumbers.map((d) => (
          <div
            key={d.id}
            className="absolute font-mono font-bold text-sm pointer-events-none animate-[floatUp_1s_ease-out_forwards] z-50"
            style={{ left: `${d.x}%`, top: `${d.y}%`, color: d.color, textShadow: `0 0 5px ${d.color}` }}
          >
            {d.value}
          </div>
        ))}
      </div>

      <Panel title="Combat Log">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-terminal-dim">Round {state.round} · newest at bottom</span>
          <button
            onClick={() => setAutoFollow((v) => !v)}
            className="text-[10px] text-terminal-dim hover:text-terminal-green border border-terminal-dim/30 px-1.5 py-0.5"
            aria-pressed={autoFollow}
            title={autoFollow ? 'Stop auto-scrolling the combat log' : 'Resume auto-scrolling to newest entries'}
          >
            {autoFollow ? '[Follow: ON]' : '[Follow: OFF]'}
          </button>
        </div>
        <div ref={combatLogRef} className="max-h-32 overflow-y-auto text-xs space-y-1" aria-live="polite">
          {state.combatLog.map((msg, i) => (
            <div key={i} className="text-terminal-dim animate-fade-in">
              <span className="text-terminal-green mr-1">&gt;</span>
              {msg}
            </div>
          ))}
          {!state.isPlayerTurn && !state.isOver && (
            <div className="text-terminal-yellow animate-pulse">Enemy acting…</div>
          )}
        </div>
      </Panel>

      {!state.isOver && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={handleAttack} disabled={!state.isPlayerTurn}>
              {'[1] Attack'}
            </Button>
            <Button onClick={handleSkill} disabled={!state.isPlayerTurn || !canAffordSkill}>
              {`[2] Skill${classDef ? ` (${classDef.skill.mpCost})` : ''}`}
            </Button>
            <Button onClick={handleQuickPotion} disabled={!state.isPlayerTurn}>
              {`[3] Potion (${hpCount}H/${mpCount}M)`}
            </Button>
            <Button variant="danger" onClick={handleRun} disabled={!state.isPlayerTurn}>
              {'[4] Run'}
            </Button>
            <Button onClick={handleGuard} disabled={!state.isPlayerTurn}>
              {'[5] Guard'}
            </Button>
            <div className="hidden sm:flex items-center justify-center text-[10px] text-terminal-dim">
              Enter=Atk Esc=Run G=Guard
            </div>
          </div>
          {(bombCount > 0 || smokeCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {bombs.map((s) => (
                <Button key={s.item.id} size="sm" onClick={() => handleUseItemId(s.item.id)} disabled={!state.isPlayerTurn}>
                  {`Bomb x${s.quantity}`}
                </Button>
              ))}
              {smokes.map((s) => (
                <Button key={s.item.id} size="sm" variant="ghost" onClick={() => handleUseItemId(s.item.id)} disabled={!state.isPlayerTurn}>
                  {`Smoke x${s.quantity}`}
                </Button>
              ))}
            </div>
          )}
          {!canAffordSkill && classDef && (
            <div className="text-[11px] text-terminal-yellow text-center">Not enough MP for {classDef.skill.name} — Guard to recover 5 MP.</div>
          )}
        </div>
      )}

      {state.isOver && (
        <div className="text-center">
          <span className={state.won ? 'text-terminal-yellow text-lg animate-pulse-glow' : 'text-terminal-red text-lg'}>
            {state.won ? 'VICTORY!' : 'DEFEATED!'}
          </span>
        </div>
      )}
    </div>
  );
}
