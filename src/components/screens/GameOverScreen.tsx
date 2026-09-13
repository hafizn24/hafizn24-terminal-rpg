import { useGameStore } from '../../game/store/gameStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

export function GameOverScreen() {
  const { player, gameOverMessage, newGame, setScreen, hasSave, stats } = useGameStore();

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
