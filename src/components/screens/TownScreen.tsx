import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { StatAllocationPanel } from '../ui/StatAllocationPanel';

export function TownScreen() {
  const player = useGameStore((s) => s.player);
  const dungeon = useGameStore((s) => s.dungeon);
  const setScreen = useGameStore((s) => s.setScreen);
  const setDungeon = useGameStore((s) => s.setDungeon);
  const setSelectedShop = useGameStore((s) => s.setSelectedShop);
  const save = useGameStore((s) => s.save);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const lastSave = useGameStore((s) => s.lastSave);
  const stats = useGameStore((s) => s.stats);
  const addLog = useUIStore((s) => s.addLog);

  if (!player) return null;

  const handleRest = () => {
    const newStats = { ...player.stats, hp: player.stats.maxHp, mp: player.stats.maxMp };
    updatePlayer({ stats: newStats });
    save();
    addLog('Rested at the Inn. HP and MP fully restored. Game saved.', 'system');
  };

  const handleEnterDungeon = () => {
    // Preserve an in-progress dungeon so fleeing doesn't wipe the run.
    // Only generate a fresh floor when there is no dungeon or it belongs to another floor.
    const existing = useGameStore.getState().dungeon;
    if (existing && existing.floor === player.floor) {
      addLog(`Resuming dungeon floor ${player.floor}...`, 'system');
      setScreen('dungeon');
      return;
    }
    if (existing && existing.floor !== player.floor) {
      const ok = window.confirm(
        `Start floor ${player.floor}? This discards your saved floor ${existing.floor} position.`
      );
      if (!ok) {
        setScreen('dungeon');
        return;
      }
    }
    addLog(`Entering dungeon floor ${player.floor}...`, 'system');
    setDungeon(null);
    setScreen('dungeon');
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="text-terminal-green text-xs tracking-widest">[ TOWN OF HAVEN ]</div>

      <h1 className="text-terminal-cyan text-xl tracking-widest uppercase">
        {'=== Town of Haven ==='}
      </h1>

      <p className="text-terminal-dim text-sm text-center max-w-md">
        A safe haven between dungeon runs. Visit the shops, rest at the Inn,
        or enter the dungeon when ready.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        <Button onClick={() => { setSelectedShop('blacksmith', 'town'); setScreen('shop'); }}>
          {'[BSM] Blacksmith'}
        </Button>
        <Button onClick={() => { setSelectedShop('potion_shop', 'town'); setScreen('shop'); }}>
          {'[POT] Potions'}
        </Button>
        <Button onClick={() => { setSelectedShop('magic_shop', 'town'); setScreen('shop'); }}>
          {'[MAG] Magic Shop'}
        </Button>
        <Button onClick={() => setScreen('inventory')}>
          {'[INV] Inventory'}
        </Button>
        <Button onClick={handleRest}>
          {'[INN] Rest & Save'}
        </Button>
        <Button onClick={() => setScreen('questBoard')}>
          {'[GLD] Guild Board'}
        </Button>
        <Button variant="danger" onClick={handleEnterDungeon} glow>
          {dungeon && dungeon.floor === player.floor ? '[DGN] Resume Dungeon' : '[DGN] Enter Dungeon'}
        </Button>
      </div>

      <div className="w-full max-w-md">
        <StatAllocationPanel />
      </div>

      {(dungeon || lastSave) && (
        <Panel title="Last Run" className="w-full max-w-md">
          <div className="text-xs space-y-1">
            {dungeon && (
              <div className="flex justify-between">
                <span className="text-terminal-dim">Floor Reached</span>
                <span className="text-terminal-yellow">{dungeon.floor}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-terminal-dim">Best Floor</span>
              <span className="text-terminal-yellow">{Math.max(stats.bestFloor, player.floor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-dim">Bosses Slain</span>
              <span className="text-terminal-yellow">{stats.bossesKilled}</span>
            </div>
            {lastSave && (
              <div className="flex justify-between">
                <span className="text-terminal-dim">Last Saved</span>
                <span className="text-terminal-dim">{new Date(lastSave).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
