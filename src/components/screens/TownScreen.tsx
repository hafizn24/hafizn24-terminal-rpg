import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

const TOWN_ART = `
    +---------------------------+
    |  [===]  [===]  [===]     |
    |  | B |  | P |  | M |     |
    |  | S |  | O |  | A |     |
    |  | M |  | T |  | G |     |
    |  [===]  [===]  [===]     |
    |       +-------+          |
    |       |  INN  |          |
    |       +-------+          |
    +---------------------------+
`;

export function TownScreen() {
  const player = useGameStore((s) => s.player);
  const dungeon = useGameStore((s) => s.dungeon);
  const setScreen = useGameStore((s) => s.setScreen);
  const setDungeon = useGameStore((s) => s.setDungeon);
  const setSelectedShop = useGameStore((s) => s.setSelectedShop);
  const save = useGameStore((s) => s.save);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const addLog = useUIStore((s) => s.addLog);

  if (!player) return null;

  const handleRest = () => {
    const newStats = { ...player.stats, hp: player.stats.maxHp, mp: player.stats.maxMp };
    updatePlayer({ stats: newStats });
    save();
    addLog('Rested at the Inn. HP and MP fully restored. Game saved.', 'system');
  };

  const handleEnterDungeon = () => {
    addLog(`Entering dungeon floor ${player.floor}...`, 'system');
    setDungeon(null);
    setScreen('dungeon');
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <pre className="text-terminal-green text-[10px] leading-tight">{TOWN_ART}</pre>

      <h1 className="text-terminal-cyan text-xl tracking-widest uppercase">
        {'=== Town of Haven ==='}
      </h1>

      <p className="text-terminal-dim text-sm text-center max-w-md">
        A safe haven between dungeon runs. Visit the shops, rest at the Inn,
        or enter the dungeon when ready.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        <Button onClick={() => { setSelectedShop('blacksmith'); setScreen('shop'); }}>
          {'[BSM] Blacksmith'}
        </Button>
        <Button onClick={() => { setSelectedShop('potion_shop'); setScreen('shop'); }}>
          {'[POT] Potions'}
        </Button>
        <Button onClick={() => { setSelectedShop('magic_shop'); setScreen('shop'); }}>
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
          {'[DGN] Enter Dungeon'}
        </Button>
      </div>

      {dungeon && (
        <Panel title="Last Run" className="w-full max-w-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-terminal-dim">Floor Reached</span>
              <span className="text-terminal-yellow">{dungeon.floor}</span>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
