import { useGameStore } from '../../game/store/gameStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

export function GameOverScreen() {
  const { player, gameOverMessage, newGame, setScreen, hasSave, stats, lastSummary } = useGameStore();

  const handleLoadSave = () => {
    const ok = useGameStore.getState().load();
    if (!ok) {
      setScreen('title');
    }
  };

  const handleNewGame = () => {
    const ok = window.confirm('Start over? This deletes your save.');
    if (!ok) return;
    newGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
      <pre className="text-terminal-red text-sm leading-tight">
{`
  +---------------------------+
  |                           |
  |     G  A  M  E           |
  |     O  V  E  R           |
  |                           |
  +---------------------------+
`}
      </pre>

      <Panel className="max-w-md w-full text-center">
        <p className="text-terminal-red text-lg mb-2">{gameOverMessage}</p>
        {player && (
          <div className="text-terminal-dim text-xs space-y-1">
            <p>Character: {player.name} (Level {player.level} {player.class})</p>
            <p>Floor Reached: {player.floor}</p>
            <p>Gold: {player.gold}</p>
            <p>Best Floor: {Math.max(stats.bestFloor, player.floor)} • Bosses: {stats.bossesKilled}</p>
          </div>
        )}
      </Panel>

      {lastSummary && (
        <Panel title={lastSummary.isDaily ? 'Run summary — daily' : 'Run summary'} className="max-w-md w-full">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-terminal-dim">Floors climbed</span>
            <span className="text-terminal-cyan text-right">{lastSummary.floorsClimbed}</span>
            <span className="text-terminal-dim">Kills</span>
            <span className="text-terminal-cyan text-right">{lastSummary.kills}</span>
            <span className="text-terminal-dim">Bosses slain</span>
            <span className="text-terminal-cyan text-right">{lastSummary.bossesKilled}</span>
            <span className="text-terminal-dim">Damage dealt</span>
            <span className="text-terminal-cyan text-right">{lastSummary.damageDealt}</span>
            <span className="text-terminal-dim">Biggest hit</span>
            <span className="text-terminal-cyan text-right">{lastSummary.biggestHit}</span>
            <span className="text-terminal-dim">Gold earned</span>
            <span className="text-terminal-cyan text-right">{lastSummary.goldEarned}</span>
            <span className="text-terminal-dim">War shards earned</span>
            <span className="text-terminal-yellow text-right">+{lastSummary.shardsEarned}◆</span>
          </div>
          <p className="text-terminal-dim text-[11px] mt-2 text-center">
            Every run feeds the next — spend shards in Renown.
          </p>
        </Panel>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {hasSave && (
          <Button onClick={handleLoadSave} glow>
            {'> Load Last Save'}
          </Button>
        )}
        <Button onClick={handleNewGame} glow={!hasSave}>
          {'> New Game'}
        </Button>
        <Button variant="ghost" onClick={() => setScreen('title')}>
          {'> Title Screen'}
        </Button>
      </div>
      {hasSave && (
        <p className="text-terminal-dim text-[11px] text-center max-w-sm">
          Tip: Load Last Save returns to your last Inn rest / autosave (victory, descend, shop).
        </p>
      )}
    </div>
  );
}
