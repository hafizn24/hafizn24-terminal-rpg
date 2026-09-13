import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { calcDamage, calcCritChance, calcExpForLevel, chance, pickRandom } from '../../utils/rng';
import { ITEMS } from '../../game/data/items';
import { CLASSES } from '../../game/data/classes';
import type { Enemy } from '../../types/game';
import { useKeyboard } from '../../hooks/useKeyboard';

interface CombatState {
  enemyHp: number;
  enemyMaxHp: number;
  isPlayerTurn: boolean;
  combatLog: string[];
  isOver: boolean;
  won: boolean;
  shaking: boolean;
  damageNumbers: DamageNumber[];
}

interface DamageNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  color: string;
}

let dmgIdCounter = 0;

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
  });

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
        }));
      }
    }
  }, [dungeon]);

  const addDamageNumber = (value: string, color: string, x: number, y: number) => {
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
  };

  const triggerShake = () => {
    setState((s) => ({ ...s, shaking: true }));
    setTimeout(() => setState((s) => ({ ...s, shaking: false })), 300);
  };

  const getPlayerAttack = () => playerRef.current!.stats.str + (playerRef.current!.equipment.weapon?.statBonus?.str || 0);
  const getPlayerDef = () => Math.floor((playerRef.current!.equipment.armor?.statBonus?.hp || 0) / 5);

  const enemyTurn = () => {
    setState((s) => {
      if (s.isOver) return s;
      const p = playerRef.current!;
      const e = enemyRef.current!;

      let dmg: number;
      let logMsg: string;

      const rolledSkill = e.skills.length > 0 ? pickRandom(e.skills) : null;
      if (rolledSkill && chance(rolledSkill.chance)) {
        dmg = calcDamage(Math.floor(e.attack * rolledSkill.power), getPlayerDef());
        logMsg = `${e.name} uses ${rolledSkill.name}! ${dmg} damage!`;
      } else {
        dmg = calcDamage(e.attack, getPlayerDef());
        logMsg = `${e.name} attacks for ${dmg} damage.`;
      }

      const newHp = Math.max(0, p.stats.hp - dmg);
      updatePlayer({ stats: { ...p.stats, hp: newHp } });

      addLog(logMsg, 'danger');
      triggerShake();
      addDamageNumber(`-${dmg}`, '#ff0040', 50 + Math.random() * 30, 60 + Math.random() * 20);

      if (newHp <= 0) {
        setGameOver(`Defeated by ${e.name} on floor ${dungeonRef.current?.floor || 1}.`);
        return {
          ...s,
          combatLog: [...s.combatLog, logMsg, 'You have been slain!'],
          isOver: true,
          won: false,
        };
      }

      return {
        ...s,
        combatLog: [...s.combatLog, logMsg],
        isPlayerTurn: true,
      };
    });
  };

  const handleAttack = () => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;

    const crit = chance(calcCritChance(p.stats.dex));
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

    if (newEnemyHp <= 0) {
      setTimeout(() => handleVictory(), 300);
    } else {
      setTimeout(enemyTurn, 800);
    }
  };

  const handleSkill = () => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    const p = playerRef.current!;
    const e = enemyRef.current!;
    const classDef = CLASSES.find((c) => c.id === p.class);
    if (!classDef) return;

    if (p.stats.mp < classDef.skill.mpCost) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'Not enough MP!'] }));
      return;
    }

    const atk = p.stats.str + p.stats.int + (p.equipment.weapon?.statBonus?.str || 0);
    const dmg = calcDamage(Math.floor(atk * classDef.skill.power / 2), e.defense);
    const newEnemyHp = Math.max(0, s.enemyHp - dmg);

    updatePlayer({ stats: { ...p.stats, mp: p.stats.mp - classDef.skill.mpCost } });

    addDamageNumber(`-${dmg}`, '#00ffff', 50 + Math.random() * 30, 20 + Math.random() * 20);
    triggerShake();

    const logMsg = `${classDef.skill.name}! Deals ${dmg} damage!`;
    setState((prev) => ({
      ...prev,
      enemyHp: newEnemyHp,
      isPlayerTurn: false,
      combatLog: [...prev.combatLog, logMsg],
    }));
    addLog(logMsg, 'combat');

    if (newEnemyHp <= 0) {
      setTimeout(() => handleVictory(), 300);
    } else {
      setTimeout(enemyTurn, 800);
    }
  };

  const handleItem = () => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
    const p = playerRef.current!;

    const potion = p.inventory.find(
      (slot) => slot.item.type === 'potion' && slot.quantity > 0 && (slot.item.healAmount || slot.item.mpRestoreAmount)
    );
    if (!potion) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'No potions available!'] }));
      return;
    }

    if (potion.item.healAmount && p.stats.hp >= p.stats.maxHp) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'HP already full! Potion not used.'] }));
      return;
    }
    if (potion.item.mpRestoreAmount && !potion.item.healAmount && p.stats.mp >= p.stats.maxMp) {
      setState((prev) => ({ ...prev, combatLog: [...prev.combatLog, 'MP already full! Potion not used.'] }));
      return;
    }

    const newStats = { ...p.stats };
    let logMsg = '';

    if (potion.item.healAmount) {
      const healed = Math.min(potion.item.healAmount, newStats.maxHp - newStats.hp);
      newStats.hp = Math.min(newStats.maxHp, newStats.hp + potion.item.healAmount);
      logMsg = `Used ${potion.item.name}. Healed ${healed} HP.`;
      addDamageNumber(`+${healed}`, '#00ff41', 45, 75);
    } else if (potion.item.mpRestoreAmount) {
      const restored = Math.min(potion.item.mpRestoreAmount, newStats.maxMp - newStats.mp);
      newStats.mp = Math.min(newStats.maxMp, newStats.mp + potion.item.mpRestoreAmount);
      logMsg = `Used ${potion.item.name}. Restored ${restored} MP.`;
      addDamageNumber(`+${restored}`, '#00ffff', 45, 75);
    }

    const newInv = p.inventory
      .map((slot) => (slot.item.id === potion.item.id ? { ...slot, quantity: slot.quantity - 1 } : slot))
      .filter((slot) => slot.quantity > 0);

    updatePlayer({ stats: newStats, inventory: newInv });
    setState((prev) => ({ ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, logMsg] }));
    addLog(logMsg, 'loot');

    setTimeout(enemyTurn, 800);
  };

  const handleRun = () => {
    const s = stateRef.current;
    if (!s.isPlayerTurn || s.isOver) return;
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
  };

  const handleVictory = () => {
    const p = playerRef.current!;
    const e = enemyRef.current!;
    const expGain = e.expReward;
    const goldGain = e.goldReward;
    let newExp = p.exp + expGain;
    let newLevel = p.level;
    const newStats = { ...p.stats };

    let newInv = [...p.inventory];
    e.lootTable.forEach((loot) => {
      if (chance(loot.chance)) {
        const item = ITEMS[loot.itemId];
        if (item) {
          const idx = newInv.findIndex((s) => s.item.id === item.id);
          if (idx >= 0) {
            newInv = newInv.map((s, i) => (i === idx ? { ...s, quantity: s.quantity + loot.quantity } : s));
          } else {
            newInv = [...newInv, { item, quantity: loot.quantity }];
          }
          addLog(`Loot: ${item.name} x${loot.quantity}`, 'loot');
        }
      }
    });

    let threshold = p.expToNext;
    while (newExp >= threshold) {
      newExp -= threshold;
      newLevel++;
      const classDef = CLASSES.find((c) => c.id === p.class);
      if (classDef) {
        newStats.str += classDef.growth.str;
        newStats.dex += classDef.growth.dex;
        newStats.int += classDef.growth.int;
        newStats.maxHp += classDef.growth.hp;
        newStats.maxMp += classDef.growth.mp;
        newStats.hp = newStats.maxHp;
        newStats.mp = newStats.maxMp;
      }
      threshold = calcExpForLevel(newLevel);
      addLog(`LEVEL UP! Now level ${newLevel}!`, 'loot');
    }

    updatePlayer({
      level: newLevel,
      exp: newExp,
      expToNext: threshold,
      stats: newStats,
      gold: p.gold + goldGain,
      inventory: newInv,
    });

    useGameStore.getState().updateQuestProgress('kill', e.id);
    useGameStore.getState().updateQuestProgress('gold', 'any', p.gold + goldGain);

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
    setState((prev) => ({
      ...prev,
      combatLog: [...prev.combatLog, logMsg],
      isOver: true,
      won: true,
    }));
    addLog(logMsg, 'loot');

    setTimeout(() => setScreen('dungeon'), 1500);
  };

  const keyMap = useMemo(() => ({
    '1': handleAttack,
    Enter: handleAttack,
    '2': handleSkill,
    '3': handleItem,
    '4': handleRun,
    Escape: handleRun,
  }), []);

  useKeyboard(keyMap);

  if (!player || !enemyRef.current) return <div className="text-terminal-dim">No enemy...</div>;
  const enemy = enemyRef.current;

  return (
    <div className={`flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto ${state.shaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
      <h1 className="text-terminal-red text-lg tracking-widest uppercase text-center">
        {'<< Combat >>'}
      </h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Panel title={enemy.name} className="flex-1 relative">
          <pre className="text-terminal-red text-xs text-center mb-2 whitespace-pre">
            {enemy.ascii}
          </pre>
          <ProgressBar current={state.enemyHp} max={state.enemyMaxHp} label="HP" color="red" />
        </Panel>

        <Panel title={player.name} className="flex-1">
          <div className="text-xs text-terminal-dim mb-2 text-center uppercase">
            {player.class} - Level {player.level}
          </div>
          <div className="space-y-1">
            <ProgressBar current={player.stats.hp} max={player.stats.maxHp} label="HP" color="red" />
            <ProgressBar current={player.stats.mp} max={player.stats.maxMp} label="MP" color="cyan" />
          </div>
        </Panel>
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
        <div className="max-h-24 overflow-y-auto text-xs space-y-1">
          {state.combatLog.map((msg, i) => (
            <div key={i} className="text-terminal-dim animate-fade-in">
              <span className="text-terminal-green mr-1">&gt;</span>
              {msg}
            </div>
          ))}
        </div>
      </Panel>

      {!state.isOver && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleAttack} disabled={!state.isPlayerTurn}>
            {'[1] Attack'}
          </Button>
          <Button onClick={handleSkill} disabled={!state.isPlayerTurn}>
            {'[2] Skill'}
          </Button>
          <Button onClick={handleItem} disabled={!state.isPlayerTurn}>
            {'[3] Item'}
          </Button>
          <Button variant="danger" onClick={handleRun} disabled={!state.isPlayerTurn}>
            {'[4] Run'}
          </Button>
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
