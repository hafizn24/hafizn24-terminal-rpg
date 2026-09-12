import { useGameStore } from '../../game/store/gameStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

export function GameOverScreen() {
  const { player, gameOverMessage, newGame, setScreen } = useGameStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
      <pre className="text-terminal-red text-sm leading-tight">
{`
 +---------------------------+
 ¦                           ¦
 ¦     G  A  M  E           ¦
 ¦     O  V  E  R           ¦
 ¦                           ¦
 +---------------------------+
`}
      </pre>

      <Panel className="max-w-md w-full text-center">
        <p className="text-terminal-red text-lg mb-2">{gameOverMessage}</p>
        {player && (
          <div className="text-terminal-dim text-xs space-y-1">
            <p>Character: {player.name} (Level {player.level} {player.class})</p>
            <p>Floor Reached: {player.floor}</p>
            <p>Gold Earned: {player.gold}</p>
          </div>
        )}
      </Panel>

      <div className="flex gap-3">
        <Button onClick={newGame} glow>
          {'> New Game'}
        </Button>
        <Button variant="ghost" onClick={() => setScreen('title')}>
          {'> Title Screen'}
        </Button>
      </div>
    </div>
  );
}
