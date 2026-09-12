import { useEffect, useRef, useMemo } from 'react';
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

  const handleMove = (dx: number, dy: number) => {
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
  };

  const handleRoomEntry = (room: Room, p: typeof playerRef.current) => {
    if (!p) return;
    switch (room.type) {
      case 'monster':
        if (room.enemy) {
          addLog(`A ${room.enemy.name} appears!`, 'combat');
          useGameStore.getState().setScreen('combat');
        }
        break;
      case 'treasure':
        if (room.item) {
          addLog(`Found: ${room.item.name}!`, 'loot');
          const inv = [...p.inventory];
          const existing = inv.find((s) => s.item.id === room.item!.id);
          if (existing) {
            existing.quantity++;
          } else {
            inv.push({ item: room.item, quantity: 1 });
          }
          updatePlayer({ inventory: inv });
        }
        break;
      case 'trap': {
        const dmg = room.trapDamage || 10;
        const newHp = Math.max(0, p.stats.hp - dmg);
        updatePlayer({ stats: { ...p.stats, hp: newHp } });
        addLog(`Trap! Took ${dmg} damage!`, 'danger');
        if (newHp <= 0) setGameOver('Killed by a dungeon trap.');
        break;
      }
      case 'stairs':
        addLog('Found the stairs to the next floor!', 'system');
        break;
      case 'shop':
        addLog('A mysterious merchant appears!', 'info');
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
  };

  const handleDescend = () => {
    const p = playerRef.current;
    if (!p) return;
    const nextFloor = p.floor + 1;
    updatePlayer({ floor: nextFloor });
    const newDungeon = generateDungeon(nextFloor);
    setDungeon(newDungeon);
    addLog(`Descended to floor ${nextFloor}.`, 'system');
    useGameStore.getState().updateQuestProgress('floor', 'any');
  };

  const keyMap = useMemo(() => ({
    w: () => handleMove(0, -1),
    ArrowUp: () => handleMove(0, -1),
    s: () => handleMove(0, 1),
    ArrowDown: () => handleMove(0, 1),
    a: () => handleMove(-1, 0),
    ArrowLeft: () => handleMove(-1, 0),
    d: () => handleMove(1, 0),
    ArrowRight: () => handleMove(1, 0),
    escape: () => setScreen('town'),
  }), [dungeon]);

  useKeyboard(keyMap);

  if (!player || !dungeon) return <div className="text-terminal-dim">Loading...</div>;

  const currentRoom: Room = dungeon.rooms[dungeon.playerPos.y][dungeon.playerPos.x];

  const roomTypeSymbol = (room: Room) => {
    if (!room.explored) return '\u00B7';
    if (room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y) return '@';
    switch (room.type) {
      case 'empty': return '\u00B7';
      case 'monster': return 'M';
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
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          {'[Flee to Town]'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Panel title="Dungeon Map" className="flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5 font-mono">
            {dungeon.rooms.map((row, y) => (
              <div key={y} className="flex gap-0.5">
                {row.map((room, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs border border-terminal-dim/30
                      ${roomColor(room)} ${
                      room.x === dungeon.playerPos.x && room.y === dungeon.playerPos.y
                        ? 'bg-terminal-cyan/20 border-terminal-cyan'
                        : room.explored
                        ? 'bg-terminal-panel'
                        : 'bg-terminal-bg'
                    }`}
                  >
                    {roomTypeSymbol(room)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-terminal-dim flex flex-wrap gap-3">
            <span><span className="text-terminal-cyan">@</span> You</span>
            <span><span className="text-terminal-red">M</span> Monster</span>
            <span><span className="text-terminal-yellow">T</span> Treasure</span>
            <span><span className="text-terminal-red">^</span> Trap</span>
            <span><span className="text-terminal-green">$</span> Shop</span>
            <span><span className="text-terminal-cyan">{'>'}</span> Stairs</span>
            <span><span className="text-terminal-red">B</span> Boss</span>
          </div>
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
                <span className="text-terminal-cyan">Stairs leading deeper into the dungeon.</span>
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
              <Button size="sm" onClick={() => handleMove(0, -1)} disabled={!adjacentRooms.up}>
                {'^'} North
              </Button>
              <div />
              <Button size="sm" onClick={() => handleMove(-1, 0)} disabled={!adjacentRooms.left}>
                {'<'} West
              </Button>
              {isCurrentStairs ? (
                <Button size="sm" onClick={handleDescend} glow>
                  {'v'} Descend
                </Button>
              ) : (
                <Button size="sm" disabled>
                  {'v'} South
                </Button>
              )}
              <Button size="sm" onClick={() => handleMove(1, 0)} disabled={!adjacentRooms.right}>
                {'>'} East
              </Button>
            </div>
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
