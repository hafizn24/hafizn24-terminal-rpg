import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { calcDamage, calcCritChance, calcDodgeChance, chance, pickRandom } from '../../utils/rng';
import { playSfx } from '../../utils/audio';
import { recordTelemetryEvent } from '../../utils/telemetry';
import {
  getPlayerDefTotal,
  getPrimaryAttack,
  getSkillAttack,
  intentPreviewRange,
} from '../../engine/rules/damage';
import { effectiveSkillCost, getRelicMods } from '../../engine/rules/relics';
import { CLASSES } from '../../game/data/classes';
import { isBossEnemy } from '../../game/data/ascii';
import { isFinalFloor } from '../../game/systems/dungeonGenerator';
import type { ClassSkill, Enemy, EnemySkill } from '../../types/game';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useMetaStore } from '../../game/store/metaStore';

/** Short-lived combat buffs: setup now, payoff later (the rotation). */
interface PlayerBuffs {
  atkMult: number;
  atkTurns: number;
  critNext: boolean;
  critTurns: number;
  evadeCharges: number;
  shield: number;
}

const EMPTY_BUFFS: PlayerBuffs = {
  atkMult: 1,
  atkTurns: 0,
  critNext: false,
  critTurns: 0,
  evadeCharges: 0,
  shield: 0,
};

interface EnemyWeaken {
  mult: number;
  turns: number;
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
  playerBuffs: PlayerBuffs;
  enemyWeaken: EnemyWeaken | null;
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

/** Tick setup buffs down at the end of each enemy turn. Pure. */
function tickBuffs(prev: CombatState): Partial<CombatState> {
  const b = prev.playerBuffs;
  const atkTurns = Math.max(0, b.atkTurns - 1);
  const critTurns = Math.max(0, b.critTurns - 1);
  const w = prev.enemyWeaken;
  const wTurns = w ? w.turns - 1 : 0;
  return {
    playerBuffs: {
      ...b,
      atkTurns,
      atkMult: atkTurns > 0 ? b.atkMult : 1,
      critTurns,
      critNext: critTurns > 0 ? b.critNext : false,
    },
    enemyWeaken: w && wTurns > 0 ? { mult: w.mult, turns: wTurns } : null,
  };
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
    playerBuffs: { ...EMPTY_BUFFS },
    enemyWeaken: null,
  });
  // Single-line combat log: only the latest entry is shown, fixed height,
  // never expands. Full history stays in the global log (dungeon LogPanel).

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
    const mods = getRelicMods(p.relics ?? []);
    const buffs = stateRef.current.playerBuffs;
    const rage = buffs.atkTurns > 0 ? buffs.atkMult : 1;
    return Math.floor(getPrimaryAttack(p) * mods.basicMult * rage);
  }, []);

  const getPlayerDef = useCallback(() => {
    const p = playerRef.current!;
    return getPlayerDefTotal(p) + getRelicMods(p.relics ?? []).defBonus;
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
          playSfx('defeat');
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
    },
    // handleVictory intentionally omitted: it is only invoked deferred inside
    // setTimeout and reads live state through refs/the store, so memoizing on
    // its identity would re-create this callback every render for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const mods = getRelicMods(p.relics ?? []);
    const pDex = p.stats.dex + (p.equipment.accessory?.statBonus?.dex || 0);
    const dodgeChance = Math.min(0.38, calcDodgeChance(pDex, e.stats.dex, guarding) + mods.dodgeBonus);

    // Smoke Veil charges dodge guaranteed, then fall through to the DEX roll.
    const buffs = stateRef.current.playerBuffs;
    const veiled = buffs.evadeCharges > 0;
    if (veiled) {
      setState((prev) => ({
        ...prev,
        playerBuffs: { ...prev.playerBuffs, evadeCharges: prev.playerBuffs.evadeCharges - 1 },
      }));
    }

    // DEX dodge — avoids the hit entirely (guard boosts it).
    if (veiled || chance(dodgeChance)) {
      const msg = veiled
        ? 'Vanished in smoke! No damage!'
        : guarding
          ? 'Dodged behind your guard! No damage!'
          : 'Dodged! No damage!';
      addLog(msg, 'combat');
      addDamageNumber('MISS', '#00ffff', 50, 65);
      setState((prev) => ({
        ...prev,
        combatLog: [...prev.combatLog, msg],
        isPlayerTurn: true,
        guarding: false,
        intent: rollIntent(e),
        round: prev.round + 1,
        ...tickBuffs(prev),
      }));
      return;
    }

    let dmg: number;
    let logMsg: string;
    let statusToApply: StatusEffect | null = null;

    // Weaken curses the attacker's output, not your armor — a different answer
    // than Guard for telegraphed heavy intents.
    const weakenMult = stateRef.current.enemyWeaken?.mult ?? 1;
    if (intent) {
      dmg = calcDamage(Math.floor(e.attack * intent.power * weakenMult), getPlayerDef());
      logMsg = `${e.name} uses ${intent.name}! ${dmg} damage!`;
      if (intent.status) statusToApply = { ...intent.status };
    } else {
      dmg = calcDamage(Math.floor(e.attack * weakenMult), getPlayerDef());
      logMsg = `${e.name} attacks for ${dmg} damage.`;
    }

    if (guarding) {
      dmg = Math.max(1, Math.floor(dmg / 2));
      logMsg += ' (Guarded!)';
    }

    // Shields absorb after Guard so setup (Stone Skin) and reaction (Guard)
    // stack instead of competing.
    const shield = stateRef.current.playerBuffs.shield;
    if (shield > 0 && dmg > 0) {
      const absorbed = Math.min(shield, dmg);
      dmg -= absorbed;
      logMsg += ` (${absorbed} warded!)`;
      setState((prev) => ({
        ...prev,
        playerBuffs: { ...prev.playerBuffs, shield: prev.playerBuffs.shield - absorbed },
      }));
    }

    const newHp = Math.max(0, p.stats.hp - dmg);
    // Guard mitigates damage only — no MP regen, so Guard->Skill is a
    // tempo trade (survive now, attack later) instead of a free engine.
    updatePlayer({ stats: { ...p.stats, hp: newHp } });

    addLog(logMsg, 'danger');
    triggerShake();
    addDamageNumber(`-${dmg}`, '#ff0040', 50 + Math.random() * 30, 60 + Math.random() * 20);

    if (newHp <= 0) {
      playSfx('defeat');
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
      ...tickBuffs(prev),
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
    },
    // handleVictory intentionally omitted: deferred-only call (see above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enemyTurn]
  );

  const handleAttack = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    if (!p || !e) return;

    // Cheap Shot guarantees the crit; otherwise roll it.
    const buffs = stateRef.current.playerBuffs;
    const forcedCrit = buffs.critNext && buffs.critTurns > 0;
    const crit = forcedCrit || chance(getCritChance());
    const dmg = calcDamage(getPlayerAttack(), e.defense);
    const finalDmg = crit ? Math.floor(dmg * 2) : dmg;
    const newEnemyHp = Math.max(0, s.enemyHp - finalDmg);

    const logMsg = crit
      ? `CRITICAL HIT! You deal ${finalDmg} damage!`
      : `You attack for ${finalDmg} damage.`;

    addDamageNumber(crit ? `CRIT -${finalDmg}` : `-${finalDmg}`, crit ? '#ffd700' : '#00ff41', 50 + Math.random() * 30, 20 + Math.random() * 20);
    if (crit) triggerShake();
    playSfx(crit ? 'crit' : 'hit');
    useGameStore.getState().recordRunDamage(finalDmg);

    setState((prev) => ({
      ...prev,
      enemyHp: newEnemyHp,
      isPlayerTurn: false,
      combatLog: [...prev.combatLog, logMsg],
      // The opener is spent whether or not it crit — timing matters.
      playerBuffs: forcedCrit
        ? { ...prev.playerBuffs, critNext: false, critTurns: 0 }
        : prev.playerBuffs,
    }));
    addLog(logMsg, crit ? 'loot' : 'combat');
    checkVictory(newEnemyHp);
  }, [addDamageNumber, addLog, applyStatusTick, checkVictory, getCritChance, getPlayerAttack, triggerShake]);

  const handleSkillId = useCallback((skillId: string) => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    if (applyStatusTick('player')) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    const classDef = CLASSES.find((c) => c.id === p.class);
    const skill: ClassSkill | undefined = classDef?.skills.find((sk) => sk.id === skillId);
    if (!classDef || !p || !e || !skill) return;
    if (p.level < skill.unlockLevel) return;

    const mods = getRelicMods(p.relics ?? []);
    const cost = effectiveSkillCost(skill.mpCost, mods);
    if (p.stats.mp < cost) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'Not enough MP! Use an MP potion or basic attack.'] }));
      return;
    }

    let atk = getSkillAttack(p, {
      str: (p.equipment.weapon?.statBonus?.str || 0) + (p.equipment.accessory?.statBonus?.str || 0),
      dex: (p.equipment.weapon?.statBonus?.dex || 0) + (p.equipment.accessory?.statBonus?.dex || 0),
      int: (p.equipment.weapon?.statBonus?.int || 0) + (p.equipment.accessory?.statBonus?.int || 0),
    });
    // Adrenaline: desperate skills hit harder.
    if (p.stats.hp < p.stats.maxHp * 0.3) atk = Math.floor(atk * mods.lowHpSkillMult);
    // Rage fuels skills too — setup into payoff.
    const buffs = stateRef.current.playerBuffs;
    if (buffs.atkTurns > 0) atk = Math.floor(atk * buffs.atkMult);

    const spendMp = { ...p.stats, mp: p.stats.mp - cost };
    const endTurnWithUtility = (logMsg: string, stats = spendMp, extra: Partial<CombatState> = {}) => {
      updatePlayer({ stats });
      addLog(logMsg, 'combat');
      playSfx('click');
      setState((prev) => ({ ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, logMsg], ...extra }));
      setTimeout(enemyTurn, 800);
    };

    if (skill.kind === 'strike' || skill.kind === 'nuke' || skill.kind === 'healStrike') {
      const isSneak = skill.id === 'backstab' && chance(0.25);
      const base = calcDamage(Math.floor((atk * skill.power) / 2), e.defense);
      const dmg = isSneak ? base * 2 : base;
      const newEnemyHp = Math.max(0, s.enemyHp - dmg);

      let newStats = { ...spendMp };
      let logMsg = `${skill.name}! Deals ${dmg} damage!${isSneak ? ' SNEAK BONUS x2!' : ''}`;
      if (skill.kind === 'healStrike') {
        const heal = 2 * p.stats.int;
        newStats = { ...newStats, hp: Math.min(newStats.maxHp, newStats.hp + heal) };
        logMsg += ` Healed ${heal} HP.`;
        addDamageNumber(`+${heal}`, '#00ff41', 40, 75);
      }
      updatePlayer({ stats: newStats });

      addDamageNumber(`-${dmg}`, '#00ffff', 50 + Math.random() * 30, 20 + Math.random() * 20);
      triggerShake();
      playSfx('skill');
      useGameStore.getState().recordRunDamage(dmg);

      setState((prev) => ({
        ...prev,
        enemyHp: newEnemyHp,
        isPlayerTurn: false,
        combatLog: [...prev.combatLog, logMsg],
      }));
      addLog(logMsg, 'combat');
      checkVictory(newEnemyHp);
      return;
    }

    switch (skill.kind) {
      case 'rage':
        endTurnWithUtility(
          `${skill.name}! +${Math.round((skill.power - 1) * 100)}% attack for 3 turns.`,
          spendMp,
          { playerBuffs: { ...buffs, atkMult: skill.power, atkTurns: 3 } },
        );
        break;
      case 'shield': {
        const amount = skill.id === 'divine_shield'
          ? Math.floor(skill.power + 2 * p.stats.int)
          : Math.floor(skill.power + 5 * p.level);
        addDamageNumber(`+${amount} ward`, '#00ffff', 40, 75);
        endTurnWithUtility(
          `${skill.name}! Warded ${amount} damage.`,
          spendMp,
          { playerBuffs: { ...buffs, shield: buffs.shield + amount } },
        );
        break;
      }
      case 'weaken':
        endTurnWithUtility(
          `${skill.name}! The foe is cursed (-${Math.round((1 - skill.power) * 100)}% attack, 3 turns).`,
          spendMp,
          { enemyWeaken: { mult: skill.power, turns: 3 } },
        );
        break;
      case 'critNext':
        endTurnWithUtility(
          `${skill.name}! Your next attack within 3 turns always crits.`,
          spendMp,
          { playerBuffs: { ...buffs, critNext: true, critTurns: 3 } },
        );
        break;
      case 'evade':
        endTurnWithUtility(
          `${skill.name}! You will dodge the next ${skill.power} hits.`,
          spendMp,
          { playerBuffs: { ...buffs, evadeCharges: buffs.evadeCharges + skill.power } },
        );
        break;
      case 'cleanse': {
        const heal = Math.floor(skill.power * p.stats.int);
        const had = stateRef.current.playerStatus;
        const newStats = { ...spendMp, hp: Math.min(spendMp.maxHp, spendMp.hp + heal) };
        addDamageNumber(`+${heal}`, '#00ff41', 40, 75);
        updatePlayer({ stats: newStats });
        const logMsg = `${skill.name}! ${had ? 'Affliction purged. ' : ''}Restored ${heal} HP.`;
        addLog(logMsg, 'combat');
        setState((prev) => ({
          ...prev,
          playerStatus: null,
          isPlayerTurn: false,
          combatLog: [...prev.combatLog, logMsg],
        }));
        setTimeout(enemyTurn, 800);
        break;
      }
      default:
        break;
    }
  }, [addDamageNumber, addLog, applyStatusTick, checkVictory, enemyTurn, triggerShake, updatePlayer]);

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
        useGameStore.getState().recordRunDamage(total);
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

      // Purifying Herb: the only cleanse outside the Cleric. Never wasted —
      // usable at full HP, and it still costs the turn.
      if (item.cleanse) {
        consumeOne(itemId);
        const had = stateRef.current.playerStatus;
        const msg = had
          ? `Used ${item.name}. ${had.id === 'burn' ? 'Burn' : 'Poison'} purged!`
          : `Used ${item.name}. (No affliction.)`;
        setState((prev) => ({ ...prev, playerStatus: null, isPlayerTurn: false, combatLog: [...prev.combatLog, msg] }));
        addLog(msg, 'loot');
        setTimeout(enemyTurn, 800);
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
    // Afflicted? Reach for the herb before anything else.
    const herb = p.inventory.find(
      (sl) => sl.item.cleanse && sl.quantity > 0 && stateRef.current.playerStatus
    );
    if (herb) {
      handleUseItemId(herb.item.id);
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
    const msg = 'You brace! Next hit halved, +15% dodge.';
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
    // Elites drop extra consumables/accessories — and sometimes a vault key.
    if (e.isElite) {
      if (chance(0.35)) {
        const bonus = pickRandom(['fire_bomb', 'smoke_bomb', 'hp_potion_m', 'lucky_charm', 'iron_ring']);
        store.addItem(bonus, 1);
        addLog(`Elite loot: ${bonus.replace(/_/g, ' ')}!`, 'loot');
      }
      if (chance(0.15)) {
        store.addItem('dungeon_key', 1);
        addLog('Elite loot: dungeon key!', 'loot');
      }
    }

    const mods = getRelicMods(p.relics ?? []);
    const modifier = dungeonRef.current?.modifier ?? 'none';
    const goldGain = Math.floor(e.goldReward * mods.goldMult * (modifier === 'golden' ? 2 : 1));
    const expGain = Math.floor(e.expReward * (modifier === 'swarm' ? 1.25 : 1));

    const fresh = useGameStore.getState().player!;
    useGameStore.getState().updatePlayer({ gold: fresh.gold + goldGain });
    const levelMsgs = useGameStore.getState().gainExp(expGain);
    levelMsgs.forEach((m) => addLog(m, 'loot'));
    // Blood Vial: victory mends wounds.
    if (mods.healOnKill > 0) {
      const after = useGameStore.getState().player!;
      if (after.stats.hp < after.stats.maxHp && after.stats.hp > 0) {
        useGameStore.getState().updatePlayer({
          stats: { ...after.stats, hp: Math.min(after.stats.maxHp, after.stats.hp + mods.healOnKill) },
        });
      }
    }

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
    // Run telemetry + Bestiary unlock (Elite shares the base enemy id).
    store.recordRunKill(goldGain, isBoss);
    useMetaStore.getState().recordKill(e.id);
    if (isBoss) {
      recordTelemetryEvent({ t: 'bossKilled', classId: p.class, floor: dungeonRef.current?.floor ?? 1, boss: e.id });
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

    const logMsg = `Victory! +${expGain} EXP, +${goldGain} Gold`;
    addLog(logMsg, 'loot');
    playSfx('victory');
    if (levelMsgs.length > 0) playSfx('levelup');

    // Volatile burst: killing it is only half the fight — kill it last, kill
    // it from full HP, or kill it and die. It CAN kill you back.
    if (e.onDeath?.kind === 'burst') {
      const floor = dungeonRef.current?.floor ?? 1;
      const burst = e.onDeath.flat + e.onDeath.perFloor * floor;
      const cur = useGameStore.getState().player!;
      const left = Math.max(0, cur.stats.hp - burst);
      useGameStore.getState().updatePlayer({ stats: { ...cur.stats, hp: left } });
      const burstMsg = `${e.name} explodes! ${burst} damage!`;
      addLog(burstMsg, 'danger');
      triggerShake();
      playSfx('trap');
      addDamageNumber(`-${burst}`, '#ff8800', 50, 65);
      if (left <= 0) {
        playSfx('defeat');
        setGameOver(`Slain by a ${e.name} burst on floor ${floor}.`);
        setState((prev) => ({
          ...prev,
          combatLog: [...prev.combatLog, logMsg, ...levelMsgs, burstMsg, 'You have been slain!'],
          isOver: true,
          won: false,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        combatLog: [...prev.combatLog, logMsg, ...levelMsgs, burstMsg],
        isOver: true,
        won: true,
      }));
      setTimeout(() => {
        useGameStore.getState().save();
        setScreen('dungeon');
      }, 1500);
      return;
    }

    setState((prev) => ({
      ...prev,
      combatLog: [...prev.combatLog, logMsg, ...levelMsgs],
      isOver: true,
      won: true,
    }));

    // Routing: summit the spine, draft a relic per boss, else press on.
    const isFinal =
      isBoss &&
      dungeonRef.current !== null &&
      isFinalFloor(dungeonRef.current.floor) &&
      !useMetaStore.getState().endlessUnlocked;
    // Autosave progress so a refresh doesn't wipe the run.
    setTimeout(() => {
      useGameStore.getState().save();
      if (isFinal) {
        useGameStore.getState().completeEnding();
      } else if (isBoss) {
        setScreen('relicDraft');
      } else {
        setScreen('dungeon');
      }
    }, 1500);
  }, [addDamageNumber, addLog, setDungeon, setGameOver, setScreen, triggerShake]);

  const skillKeys = useMemo(() => {
    const classDef = CLASSES.find((c) => c.id === playerRef.current?.class);
    const ids = (classDef?.skills ?? []).map((sk) => sk.id);
    return {
      '2': () => ids[0] && handleSkillId(ids[0]),
      q: () => ids[1] && handleSkillId(ids[1]),
      e: () => ids[2] && handleSkillId(ids[2]),
    };
  }, [handleSkillId]);

  const keyMap = useMemo(
    () => ({
      '1': handleAttack,
      Enter: handleAttack,
      ...skillKeys,
      '3': handleQuickPotion,
      '4': handleRun,
      '5': handleGuard,
      g: handleGuard,
      Escape: handleRun,
    }),
    [handleAttack, skillKeys, handleQuickPotion, handleRun, handleGuard]
  );

  useKeyboard(keyMap);

  if (!player || !enemyRef.current) return <div className="text-terminal-dim">No enemy...</div>;
  const enemy = enemyRef.current;
  const classDef = CLASSES.find((c) => c.id === player.class);
  const mods = getRelicMods(player.relics ?? []);
  const skillCost = (sk: ClassSkill) => effectiveSkillCost(sk.mpCost, mods);

  const hpPotions = player.inventory.filter((s) => s.item.healAmount && s.quantity > 0);
  const mpPotions = player.inventory.filter((s) => s.item.mpRestoreAmount && !s.item.healAmount && s.quantity > 0);
  const bombs = player.inventory.filter((s) => s.item.effect === 'bomb' && s.quantity > 0);
  const smokes = player.inventory.filter((s) => s.item.effect === 'smoke' && s.quantity > 0);
  const herbs = player.inventory.filter((s) => s.item.cleanse && s.quantity > 0);
  const hpCount = hpPotions.reduce((a, s) => a + s.quantity, 0);
  const mpCount = mpPotions.reduce((a, s) => a + s.quantity, 0);
  const bombCount = bombs.reduce((a, s) => a + s.quantity, 0);
  const smokeCount = smokes.reduce((a, s) => a + s.quantity, 0);

  const playerDef = getPlayerDefTotal(player) + mods.defBonus;
  const weakenMult = state.enemyWeaken?.mult ?? 1;
  const intentBase = state.intent
    ? Math.floor(enemy.attack * state.intent.power * weakenMult)
    : Math.floor(enemy.attack * weakenMult);
  const { min: intentMin, max: intentMax } = intentPreviewRange(intentBase, playerDef);
  const boss = isBossEnemy(enemy);
  const enemyFrame = enemy.isElite
    ? 'border-terminal-yellow'
    : boss
      ? 'border-terminal-red'
      : '';
  const latestLog = state.combatLog[state.combatLog.length - 1] ?? '';

  return (
    <div className={`flex flex-col gap-3 animate-fade-in max-w-md mx-auto ${state.shaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
      <div className="text-center text-terminal-red text-sm tracking-widest uppercase">
        {enemy.isElite ? `Elite ${enemy.name}` : enemy.name}
        <span className="text-terminal-dim text-[11px] ml-2">R{state.round}</span>
      </div>

      <Panel title={boss ? 'Boss' : 'Enemy'} className={enemyFrame}>
        <ProgressBar current={state.enemyHp} max={state.enemyMaxHp} label="HP" color="red" />
        <div className="mt-1 text-[11px] text-terminal-dim text-center truncate">
          {state.intent ? (
            <span className="text-terminal-yellow">{state.intent.name} (~{intentMin}-{intentMax})</span>
          ) : (
            <span>Attack (~{intentMin}-{intentMax})</span>
          )}
          {state.enemyStatus && (
            <span className="text-terminal-red ml-2">[{state.enemyStatus.id}]</span>
          )}
        </div>
      </Panel>

      <Panel title="You">
        <ProgressBar current={player.stats.hp} max={player.stats.maxHp} label="HP" color="red" />
        <div className="mt-1">
          <ProgressBar current={player.stats.mp} max={player.stats.maxMp} label="MP" color="cyan" />
        </div>
        <div className="mt-1 text-[11px] text-terminal-dim text-center truncate">
          {state.playerBuffs.atkTurns > 0 && (
            <span className="text-terminal-yellow"> · RAGE {state.playerBuffs.atkTurns}t</span>
          )}
          {state.playerBuffs.shield > 0 && (
            <span className="text-terminal-cyan"> · WARD {state.playerBuffs.shield}</span>
          )}
          {state.playerBuffs.critNext && state.playerBuffs.critTurns > 0 && (
            <span className="text-terminal-yellow"> · CRIT!</span>
          )}
          {state.playerBuffs.evadeCharges > 0 && (
            <span className="text-terminal-cyan"> · VEIL x{state.playerBuffs.evadeCharges}</span>
          )}
          {state.enemyWeaken && (
            <span className="text-terminal-yellow"> · WEAK {state.enemyWeaken.turns}t</span>
          )}
          {state.guarding && <span className="text-terminal-cyan"> · GUARD</span>}
          {state.playerStatus && (
            <span className="text-terminal-red"> · [{state.playerStatus.id}]</span>
          )}
        </div>
      </Panel>

      <div className="relative h-0">
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

      {!state.isOver && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleAttack} disabled={!state.isPlayerTurn}>
              {'[1] Attack'}
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
          </div>
          {(classDef?.skills ?? []).map((sk, i) => {
            const locked = player.level < sk.unlockLevel;
            const cost = skillCost(sk);
            const afford = player.stats.mp >= cost;
            const key = i === 0 ? '2' : i === 1 ? 'Q' : 'E';
            return (
              <Button
                key={sk.id}
                onClick={() => handleSkillId(sk.id)}
                disabled={!state.isPlayerTurn || locked || !afford}
                variant={locked ? 'ghost' : 'primary'}
                title={sk.description}
              >
                {locked ? `[Lv${sk.unlockLevel}] ${sk.name}` : `[${key}] ${sk.name} (${cost})`}
              </Button>
            );
          })}
          {(bombCount > 0 || smokeCount > 0 || herbs.length > 0) && (
            <div className="flex gap-2 flex-wrap">
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
              {herbs.map((s) => (
                <Button key={s.item.id} size="sm" variant="ghost" onClick={() => handleUseItemId(s.item.id)} disabled={!state.isPlayerTurn}>
                  {`Herb x${s.quantity}`}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border border-terminal-dim/40 px-2 h-7 flex items-center overflow-hidden" aria-live="polite">
        <span className="text-terminal-green mr-1 font-mono text-xs shrink-0">&gt;</span>
        <span className="text-terminal-dim text-xs truncate whitespace-nowrap overflow-hidden">
          {latestLog}
          {!state.isPlayerTurn && !state.isOver && ' …'}
        </span>
      </div>

      {state.isOver && (
        <div className="text-center">
          <span className={state.won ? 'text-terminal-yellow' : 'text-terminal-red'}>
            {state.won ? 'VICTORY!' : 'DEFEATED!'}
          </span>
        </div>
      )}
    </div>
  );
}
