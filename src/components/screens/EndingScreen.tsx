import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

/**
 * The summit: floor 30, Demon King dead. Credits, the run story, and the
 * choice — rest, or break the seal into endless descent.
 */
export function EndingScreen() {
  const player = useGameStore((s) => s.player);
  const lastSummary = useGameStore((s) => s.lastSummary);
  const continueEndless = useGameStore((s) => s.continueEndless);
  const setScreen = useGameStore((s) => s.setScreen);
  const endlessUnlocked = useMetaStore((s) => s.endlessUnlocked);

  if (!player) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
      <pre className="text-terminal-yellow text-sm leading-tight text-center">
{`
  +---------------------------+
  |                           |
  |   D E M O N   K I N G     |
  |       S L A I N           |
  |                           |
  +---------------------------+
`}
      </pre>

      <div className="text-terminal-green text-xs tracking-widest text-center max-w-md">
        The terminal falls silent. Thirty floors. Six seals broken.
        <br />
        Haven is safe — because of {player.name}.
      </div>

      {lastSummary && (
        <Panel title="The run that ended it" className="max-w-md w-full">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-terminal-dim">Hero</span>
            <span className="text-terminal-cyan text-right">
              {player.name} · Lv{player.level} {player.class}
            </span>
            <span className="text-terminal-dim">Kills</span>
            <span className="text-terminal-cyan text-right">{lastSummary.kills}</span>
            <span className="text-terminal-dim">Bosses slain</span>
            <span className="text-terminal-cyan text-right">{lastSummary.bossesKilled}/6</span>
            <span className="text-terminal-dim">Damage dealt</span>
            <span className="text-terminal-cyan text-right">{lastSummary.damageDealt}</span>
            <span className="text-terminal-dim">Biggest hit</span>
            <span className="text-terminal-cyan text-right">{lastSummary.biggestHit}</span>
            <span className="text-terminal-dim">War shards earned</span>
            <span className="text-terminal-yellow text-right">+{lastSummary.shardsEarned}◆</span>
          </div>
        </Panel>
      )}

      <div className="flex flex-col gap-3 w-64">
        <Button size="lg" glow onClick={continueEndless}>
          {'> Break the Seal (Endless)'}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => setScreen('title')}>
          {'> Rest (Title)'}
        </Button>
      </div>

      {endlessUnlocked && (
        <p className="text-terminal-dim text-[11px] text-center max-w-sm">
          Endless unlocked forever: future runs may descend past floor 30, where only the endgame terrors wait.
        </p>
      )}
      <p className="text-terminal-dim text-[11px] text-center max-w-sm">
        Thanks for playing hafizn24-terminal-rpg — a paid-quality game, given free. No timers, no ads, no power for
        sale.
      </p>
    </div>
  );
}
