import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { LogPanel } from '../terminal/LogPanel';
import { generateDungeon, getAdjacentRooms } from '../../game/systems/dungeonGenerator';
import { useKeyboard } from '../../hooks/useKeyboard';
import { MobileNav } from '../ui/MobileNav';
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

  const roomTypeSymbol = (room: Room) => {
    if (!room.explored) return '·';
    if (room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y) return '@';
    switch (room.type) {
      case 'empty': return '·';
      case 'monster': return 'M';
      case 'elite': return 'E';
      case 'shrine': return '+';
      case 'treasure': return 'T';
      case 'trap': return '^';
      case 'shop': return '$';
      case 'stairs': return '>';
      case 'boss': return 'B';
      case 'start': return '@';
      default: return '?';
    }
  };

  const roomColor = (room: Room) => {
    if (!room.explored) return 'text-terminal-dim';
    if (room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y) return 'text-terminal-cyan';
    switch (room.type) {
      case 'monster': return 'text-terminal-red';
      case 'elite': return 'text-terminal-yellow';
      case 'shrine': return 'text-terminal-cyan';
      case 'treasure': return 'text-terminal-yellow';
      case 'trap': return 'text-terminal-red';
      case 'shop': return 'text-terminal-green';
      case 'stairs': return 'text-terminal-cyan';
      case 'boss': return 'text-terminal-red';
      default: return 'text-terminal-dim';
    }
  };

  const isCurrentStairs = currentRoom.type === 'stairs';

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest">
          FLOOR {dungeon.floor}
        </h1>
        <Button variant="ghost" size="sm" onClick={handleFlee}>
          {'[Flee to Town]'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Panel title="Dungeon Map" className="flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5 font-mono">
            {dungeon.rooms.map((row, y) => (
              <div key={y} className="flex gap-0.5">
                {row.map((room, x) => (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    aria-label={`Move to ${x},${y} ${room.type}`}
                    className={`w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs border border-terminal-dim/30
                      ${roomColor(room)} ${
                      room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y
                        ? 'bg-terminal-cyan/20 border-terminal-cyan'
                        : room.explored
                        ? 'bg-terminal-panel'
                        : 'bg-terminal-bg'
                    }`}
                  >
                    {roomTypeSymbol(room)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-terminal-dim flex flex-wrap gap-3">
            <span><span className="text-terminal-cyan">@</span> You</span>
            <span><span className="text-terminal-red">M</span> Monster</span>
            <span><span className="text-terminal-yellow">E</span> Elite</span>
            <span><span className="text-terminal-cyan">+</span> Shrine</span>
            <span><span className="text-terminal-yellow">T</span> Treasure</span>
            <span><span className="text-terminal-red">^</span> Trap</span>
            <span><span className="text-terminal-green">$</span> Shop</span>
            <span><span className="text-terminal-cyan">{'>'}</span> Stairs</span>
            <span><span className="text-terminal-red">B</span> Boss</span>
          </div>
          <div className="mt-1 text-[10px] text-terminal-dim">Tip: tap an adjacent tile to move. Press E on stairs to descend.</div>
        </Panel>

        <div className="flex-1 flex flex-col gap-3">
          <Panel title="Current Room">
            <div className="text-sm">
              {currentRoom.type === 'empty' && (
                <span className="text-terminal-dim">An empty chamber. Dust and silence.</span>
              )}
              {currentRoom.type === 'monster' && currentRoom.enemy && (
                <span className="text-terminal-red">
                  A {currentRoom.enemy.name} lurks here!
                </span>
              )}
              {currentRoom.type === 'elite' && currentRoom.enemy && (
                <span className="text-terminal-yellow">
                  An ELITE {currentRoom.enemy.name} radiates menace. Better loot!
                </span>
              )}
              {currentRoom.type === 'shrine' && (
                <span className="text-terminal-cyan">A glowing shrine. Restores 30% HP/MP once.</span>
              )}
              {currentRoom.type === 'treasure' && (
                <span className="text-terminal-yellow">A treasure chest gleams in the dark!</span>
              )}
              {currentRoom.type === 'trap' && (
                <span className="text-terminal-red">You sense danger in this room...</span>
              )}
              {currentRoom.type === 'shop' && (
                <span className="text-terminal-green">A traveling merchant waves at you.</span>
              )}
              {currentRoom.type === 'stairs' && (
                <span className="text-terminal-cyan">Stairs leading deeper. Press E or Descend.</span>
              )}
              {currentRoom.type === 'boss' && currentRoom.enemy && (
                <span className="text-terminal-red animate-pulse-glow">
                  {'!'} BOSS: {currentRoom.enemy.name} awaits!
                </span>
              )}
            </div>
          </Panel>

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

          <MobileNav
            onMove={(dx, dy) => handleMove(dx, dy)}
            canMove={adjacentRooms}
          />
        </div>
      </div>
    </div>
  );
}
