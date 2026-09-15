import { useGameStore, isCheckpointFloor } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

export function TownScreen() {
  const player = useGameStore((s) => s.player);
  const dungeon = useGameStore((s) => s.dungeon);
  const setScreen = useGameStore((s) => s.setScreen);
  const setDungeon = useGameStore((s) => s.setDungeon);
  const setSelectedShop = useGameStore((s) => s.setSelectedShop);
  const setStatsReturn = useGameStore((s) => s.setStatsReturn);
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
    addLog('Rested at the Inn. HP/MP restored. Game saved.', 'system');
  };

  const handleEnterDungeon = () => {
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

  const goStats = (from: 'town') => {
    setStatsReturn(from);
    setScreen('stats');
  };

  const goShop = (shop: 'blacksmith' | 'potion_shop' | 'magic_shop') => {
    setSelectedShop(shop, 'town');
    setScreen('shop');
  };

  const points = player.statPoints ?? 0;
  const checkpoint = isCheckpointFloor(player.floor);

  return (
    <div className="flex flex-col min-h-[70vh] justify-center gap-5 animate-fade-in max-w-md mx-auto">
      <div className="text-center">
        <div className="text-terminal-green text-xs tracking-widest">[ TOWN OF HAVEN ]</div>
        <div className="text-terminal-dim text-[11px] mt-1">Rest, resupply, then descend.</div>
      </div>

      <Button variant="danger" onClick={handleEnterDungeon} glow className="w-full">
        {dungeon && dungeon.floor === player.floor ? 'Resume Dungeon' : 'Enter Dungeon'}
      </Button>

      <div className="grid grid-cols-2 gap-2 w-full">
        <Button onClick={handleRest}>Inn</Button>
        <Button onClick={() => goStats('town')}>
          {points > 0 ? `Stats (${points})` : 'Stats'}
        </Button>
        <Button onClick={() => setScreen('questBoard')}>Quests</Button>
        <Button onClick={() => setScreen('inventory')}>Inventory</Button>
      </div>

      <Panel title="Shops — resupply here" titleAlign="center">
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="ghost" className="w-full" onClick={() => goShop('blacksmith')}>
            Blacksmith <span className="text-terminal-dim normal-case">— weapons & armor</span>
          </Button>
          <Button size="sm" variant="ghost" className="w-full" onClick={() => goShop('potion_shop')}>
            Potion Shop <span className="text-terminal-dim normal-case">— HP & MP</span>
          </Button>
          <Button size="sm" variant="ghost" className="w-full" onClick={() => goShop('magic_shop')}>
            Magic Shop <span className="text-terminal-dim normal-case">— charms & spells</span>
          </Button>
        </div>
      </Panel>

      <div className="text-center text-[11px] text-terminal-dim">
        Floor {player.floor} · Best {Math.max(stats.bestFloor, player.floor)} · Bosses {stats.bossesKilled}
        {!checkpoint && <span> · checkpoint at floor {Math.ceil(player.floor / 5) * 5}</span>}
        {lastSave && <span> · saved {new Date(lastSave).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}
