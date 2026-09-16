import { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { RELICS } from '../../game/data/relics';
import { playSfx } from '../../utils/audio';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

/**
 * Boss-draft: pick 1 of 3 boons after each boss. Build variety from a small
 * content set — the run shapes itself around what the dungeon offers.
 */
export function RelicDraftScreen() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const addRelic = useGameStore((s) => s.addRelic);
  const addLog = useUIStore((s) => s.addLog);

  const [choices] = useState(() => {
    const owned = new Set(player?.relics ?? []);
    const pool = RELICS.filter((r) => !owned.has(r.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  if (!player) return null;

  const handlePick = (id: string, name: string) => {
    addRelic(id);
    playSfx('relic');
    addLog(`Relic claimed: ${name}!`, 'loot');
    setScreen('dungeon');
  };

  const handleVeteran = () => {
    useGameStore.getState().updatePlayer({ gold: player.gold + 100 });
    useGameStore.getState().save();
    addLog('All relics claimed — took 100g veteran bonus instead.', 'loot');
    setScreen('dungeon');
  };

  return (
    <div className="flex flex-col gap-3 animate-fade-in max-w-md mx-auto">
      <div className="text-center">
        <div className="text-terminal-yellow text-sm tracking-widest">[ BOSS SLAIN ]</div>
        <div className="text-terminal-dim text-[11px] mt-1">Choose a boon. The run bends around it.</div>
      </div>

      {choices.length === 0 ? (
        <Panel title="Vault of echoes" titleAlign="center">
          <div className="text-terminal-dim text-xs mb-2 text-center">
            Every relic already claimed. Take the veteran's purse instead.
          </div>
          <Button glow className="w-full" onClick={handleVeteran}>
            Take 100g
          </Button>
        </Panel>
      ) : (
        <div className="flex flex-col gap-2">
          {choices.map((r) => (
            <Panel key={r.id} title={r.name}>
              <div className="text-terminal-dim text-xs mb-2">{r.description}</div>
              <Button size="sm" className="w-full" onClick={() => handlePick(r.id, r.name)}>
                Claim {r.name}
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
