import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { LogPanel } from '../terminal/LogPanel';
import { generateDungeon, getAdjacentRooms } from '../../game/systems/dungeonGenerator';
import { getFloorTheme } from '../../game/data/ascii';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { Room } from '../../types/game';

export function DungeonScreen() {
  const player = useGameStore((s) => s.player);
  const dungeon = useGameStore((s) => s.dungeon);
  const setDungeon = useGameStore((s) => s.setDungeon);
  const setScreen = useGameStore((s) => s.setScreen);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const addLog = useUIStore((s) => s.addLog);

  const dungeonRef = useRef(dungeon);
  dungeonRef.current = dungeon;
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    if (!dungeon && player) {
      const newDungeon = generateDungeon(player.floor);
      setDungeon(newDungeon);
      addLog(`Entered dungeon floor ${player.floor}.`, 'system');
    }
  }, [dungeon, player, setDungeon, addLog]);

  const adjacentRooms = dungeon ? getAdjacentRooms(dungeon) : { up: false, down: false, left: false, right: false };

  const clearRoomAt = useCallback((x: number, y: number, extra?: Partial<Room>) => {
    const latest = useGameStore.getState().dungeon;
    if (!latest) return;
    const cleared = latest.rooms.map((row) =>
      row.map((r) =>
        r.x === x && r.y === y
          ? { ...r, type: 'empty' as const, enemy: undefined, ...extra }
          : { ...r }
      )
    );
    useGameStore.getState().setDungeon({ ...latest, rooms: cleared });
  }, []);

  const handleRoomEntry = useCallback((room: Room, p: typeof playerRef.current) => {
    if (!p) return;
    switch (room.type) {
      case 'monster':
        if (room.enemy) {
          addLog(`A ${room.enemy.name} appears!`, 'combat');
          useGameStore.getState().setScreen('combat');
        }
        break;
      case 'elite':
        if (room.enemy) {
          addLog(`ELITE ${room.enemy.name} blocks your path! Better loot awaits!`, 'danger');
          useGameStore.getState().setScreen('combat');
        }
        break;
      case 'shrine': {
        const healHp = Math.floor(p.stats.maxHp * 0.3);
        const healMp = Math.floor(p.stats.maxMp * 0.3);
        updatePlayer({
          stats: {
            ...p.stats,
            hp: Math.min(p.stats.maxHp, p.stats.hp + healHp),
            mp: Math.min(p.stats.maxMp, p.stats.mp + healMp),
          },
        });
        addLog(`Rested at a shrine. +${healHp} HP, +${healMp} MP.`, 'loot');
        clearRoomAt(room.x, room.y, { item: undefined });
        break;
      }
      case 'treasure': {
        if (room.item) {
          addLog(`Found: ${room.item.name}!`, 'loot');
          useGameStore.getState().addItem(room.item.id, 1);
          // Loot the chest so re-entering doesn't farm infinite items.
          clearRoomAt(room.x, room.y, { item: undefined });
        } else {
          addLog('An empty chest. Already looted.', 'info');
        }
        break;
      }
      case 'trap': {
        const dmg = room.trapDamage || 10;
        const newHp = Math.max(0, p.stats.hp - dmg);
        updatePlayer({ stats: { ...p.stats, hp: newHp } });
        addLog(`Trap! Took ${dmg} damage! (One-shot trap, now disarmed.)`, 'danger');
        // Disarm the trap so it only triggers once.
        clearRoomAt(room.x, room.y, { trapDamage: undefined });
        if (newHp <= 0) setGameOver('Killed by a dungeon trap.');
        break;
      }
      case 'stairs':
        addLog('Found the stairs! Press E or >> Descend to go deeper.', 'system');
        break;
      case 'shop':
        addLog('A mysterious merchant appears!', 'info');
        useGameStore.getState().setSelectedShop('potion_shop', 'dungeon');
        useGameStore.getState().setScreen('shop');
        break;
      case 'boss':
        if (room.enemy) {
          addLog(`BOSS: ${room.enemy.name} blocks your path!`, 'danger');
          useGameStore.getState().setScreen('combat');
        }
        break;
      default:
        addLog('An empty room. Nothing here.', 'info');
    }
  }, [addLog, clearRoomAt, setGameOver, updatePlayer]);

  const handleMove = useCallback((dx: number, dy: number) => {
    const d = dungeonRef.current;
    const p = playerRef.current;
    if (!d || !p) return;
    const newX = d.playerPos.x + dx;
    const newY = d.playerPos.y + dy;
    if (newX < 0 || newX >= d.gridSize || newY < 0 || newY >= d.gridSize) return;

    const room = d.rooms[newY][newX];
    const newRooms = d.rooms.map((row) =>
      row.map((r) => (r.x === newX && r.y === newY ? { ...r, explored: true } : { ...r }))
    );
    setDungeon({ ...d, rooms: newRooms, playerPos: { x: newX, y: newY } });
    handleRoomEntry(room, p);
  }, [handleRoomEntry, setDungeon]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const d = dungeonRef.current;
    if (!d) return;
    const dx = x - d.playerPos.x;
    const dy = y - d.playerPos.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    handleMove(dx, dy);
  }, [handleMove]);

  const handleDescend = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const nextFloor = p.floor + 1;
    updatePlayer({ floor: nextFloor });
    const newDungeon = generateDungeon(nextFloor);
    setDungeon(newDungeon);
    addLog(`Descended to floor ${nextFloor}.`, 'system');
    const st = useGameStore.getState();
    st.updateQuestProgress('floor', 'any', nextFloor);
    useGameStore.setState((s) => ({
      stats: { ...s.stats, bestFloor: Math.max(s.stats.bestFloor, nextFloor) },
    }));
    useGameStore.getState().save();
  }, [addLog, setDungeon, updatePlayer]);

  const handleFlee = useCallback(() => {
    addLog('Fled to town. Your dungeon position is preserved — re-enter to resume.', 'system');
    setScreen('town');
  }, [addLog, setScreen]);

  const keyMap = useMemo(() => ({
    w: () => handleMove(0, -1),
    ArrowUp: () => handleMove(0, -1),
    s: () => handleMove(0, 1),
    ArrowDown: () => handleMove(0, 1),
    a: () => handleMove(-1, 0),
    ArrowLeft: () => handleMove(-1, 0),
    d: () => handleMove(1, 0),
    ArrowRight: () => handleMove(1, 0),
    e: () => {
      const d = dungeonRef.current;
      if (!d) return;
      const cur = d.rooms[d.playerPos.y][d.playerPos.x];
      if (cur.type === 'stairs') handleDescend();
    },
    escape: () => setScreen('town'),
  }), [handleDescend, handleMove, setScreen]);

  useKeyboard(keyMap);

  if (!player || !dungeon) return <div className="text-terminal-dim">Loading...</div>;

  const currentRoom: Room = dungeon.rooms[dungeon.playerPos.y][dungeon.playerPos.x];
  const theme = getFloorTheme(dungeon.floor);
  const isBossFloor = dungeon.floor % 5 === 0;
  const exploredCount = dungeon.rooms.flat().filter((r) => r.explored).length;
  const totalRooms = dungeon.gridSize * dungeon.gridSize;

  const isAdjacent = (x: number, y: number) =>
    Math.abs(x - dungeon.playerPos.x) + Math.abs(y - dungeon.playerPos.y) === 1;

  // Monospace-safe glyphs only (geometric shapes + box shading, no emoji/CJK).
  // Unexplored tiles use fog shading: ░ dim when distant, ? bright when reachable.
  const roomTypeSymbol = (room: Room) => {
    if (room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y) return '◎';
    if (!room.explored) return isAdjacent(room.x, room.y) ? '?' : '░';
    switch (room.type) {
      case 'empty': return '·';
      case 'monster': return '◆';
      case 'elite': return '◈';
      case 'shrine': return '+';
      case 'treasure': return '●';
      case 'trap': return '×';
      case 'shop': return '$';
      case 'stairs': return '▼';
      case 'boss': return '▲';
      case 'start': return '·';
      default: return '?';
    }
  };

  const roomStyle = (room: Room) => {
    const isPlayer = room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y;
    if (isPlayer) return 'text-terminal-cyan bg-terminal-cyan/20 border-terminal-cyan shadow-[0_0_8px_rgba(0,255,255,0.35)] animate-pulse-glow';
    if (!room.explored) {
      // Fog: dim shading when distant, bright + inviting when reachable.
      return isAdjacent(room.x, room.y)
        ? 'text-terminal-green bg-terminal-panel border-terminal-green/60 hover:bg-terminal-green/10 cursor-pointer font-bold'
        : 'text-terminal-dim/30 bg-terminal-bg border-terminal-dim/20';
    }
    const base = 'bg-terminal-panel ';
    switch (room.type) {
      case 'monster': return `${base}text-terminal-red border-terminal-red/40 font-bold`;
      case 'elite': return `${base}text-terminal-yellow border-terminal-yellow/60 font-bold shadow-[0_0_6px_rgba(255,215,0,0.2)]`;
      case 'shrine': return `${base}text-terminal-cyan border-terminal-cyan/50 font-bold`;
      case 'treasure': return `${base}text-terminal-yellow border-terminal-yellow/40 font-bold`;
      case 'trap': return `${base}text-terminal-red/70 border-terminal-red/30 line-through`;
      case 'shop': return `${base}text-terminal-green border-terminal-green/50 font-bold`;
      case 'stairs': return `${base}text-terminal-cyan border-terminal-cyan font-bold shadow-[0_0_6px_rgba(0,255,255,0.25)]`;
      case 'boss': return 'bg-terminal-red/10 text-terminal-red border-terminal-red font-bold shadow-[0_0_8px_rgba(255,0,64,0.3)]';
      default: return `${base}text-terminal-dim border-terminal-dim/30`;
    }
  };

  const roomDescription = (room: Room): string => {
    if (!room.explored) return 'Unexplored darkness.';
    switch (room.type) {
      case 'monster': return 'Monster lair — combat awaits!';
      case 'elite': return 'Elite den — tougher foe, better loot!';
      case 'boss': return 'BOSS chamber — steel yourself!';
      case 'treasure': return room.item ? `Treasure: ${room.item.name}` : 'Looted chest.';
      case 'trap': return room.trapDamage ? 'Armed trap — watch out!' : 'Disarmed trap.';
      case 'shrine': return 'Glowing shrine — restores 30% HP/MP.';
      case 'shop': return 'Merchant camp — press to trade.';
      case 'stairs': return 'Stairs down — press E to descend.';
      case 'start': return 'Dungeon entrance.';
      default: return 'Cleared room. Safe… for now.';
    }
  };

  const isCurrentStairs = currentRoom.type === 'stairs';

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className={`text-lg tracking-widest ${theme.labelClass}`}>
          {theme.label}
        </h1>
        <span className="text-terminal-dim text-[11px]">
          Explored {exploredCount}/{totalRooms}
        </span>
        <Button variant="ghost" size="sm" onClick={handleFlee}>
          {'[Flee to Town]'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Panel title={isBossFloor ? 'Dungeon Map — Boss Floor' : 'Dungeon Map'} className={`flex-shrink-0 ${isBossFloor ? 'border-terminal-red/50' : ''}`}>
          <div className={`flex flex-col items-center gap-1 font-mono p-2 bg-terminal-bg/50 border ${theme.frame}`}>
            {dungeon.rooms.map((row, y) => (
              <div key={y} className="flex gap-1">
                {row.map((room, x) => (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    disabled={!isAdjacent(x, y)}
                    aria-label={`Move to ${x},${y} ${room.explored ? room.type : 'unexplored'}${isAdjacent(x, y) ? ' (adjacent)' : ''}`}
                    title={room.explored ? `${room.type} (${x},${y})` : `Unexplored (${x},${y})${isAdjacent(x, y) ? ' — click to move' : ''}`}
                    className={`w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold border transition-all
                      ${roomStyle(room)} ${
                      isAdjacent(x, y) ? 'cursor-pointer hover:scale-105' : room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y ? '' : 'cursor-default'
                    }`}
                  >
                    {roomTypeSymbol(room)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-terminal-dim">You are here: ({dungeon.playerPos.x},{dungeon.playerPos.y}) — {roomDescription(currentRoom)}</div>
          <div className="mt-2 text-[10px] text-terminal-dim flex flex-wrap gap-x-3 gap-y-1">
            <span><span className="text-terminal-cyan font-bold">◎</span> You</span>
            <span><span className="text-terminal-red font-bold">◆</span> Monster</span>
            <span><span className="text-terminal-yellow font-bold">◈</span> Elite</span>
            <span><span className="text-terminal-cyan font-bold">+</span> Shrine</span>
            <span><span className="text-terminal-yellow font-bold">●</span> Treasure</span>
            <span><span className="text-terminal-red">×</span> Trap</span>
            <span><span className="text-terminal-green font-bold">$</span> Shop</span>
            <span><span className="text-terminal-cyan font-bold">▼</span> Stairs</span>
            <span><span className="text-terminal-red font-bold">▲</span> Boss</span>
            <span><span className="text-terminal-dim">░</span> Fog</span>
          </div>
          <div className="mt-1 text-[10px] text-terminal-dim">Tip: glowing tiles are reachable — click/tap to move. WASD/arrows work too. Press E on stairs to descend.</div>
        </Panel>

        <div className="flex-1 flex flex-col gap-3">
          <Panel title="Actions">
            <div className="grid grid-cols-3 gap-2">
              <div />
              <Button size="sm" onClick={() => handleMove(0, -1)} disabled={!adjacentRooms.up} aria-label="Move north">
                {'^'} North
              </Button>
              <div />
              <Button size="sm" onClick={() => handleMove(-1, 0)} disabled={!adjacentRooms.left} aria-label="Move west">
                {'<'} West
              </Button>
              <Button size="sm" onClick={() => handleMove(0, 1)} disabled={!adjacentRooms.down} aria-label="Move south">
                {'v'} South
              </Button>
              <Button size="sm" onClick={() => handleMove(1, 0)} disabled={!adjacentRooms.right} aria-label="Move east">
                {'>'} East
              </Button>
            </div>
            {isCurrentStairs && (
              <div className="mt-2">
                <Button size="sm" onClick={handleDescend} glow className="w-full">
                  {'>>'} Descend to Floor {dungeon.floor + 1} (E)
                </Button>
              </div>
            )}
          </Panel>

          <LogPanel />
        </div>
      </div>
    </div>
  );
}
