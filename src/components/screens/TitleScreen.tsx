import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { todayKey } from '../../engine/rng';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { SoundToggle } from '../ui/SoundToggle';
import type { DailyEntry } from '../../types/game';

const TITLE_ART = `
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
`;

const SUBTITLE = 'A Terminal-Based Adventure';

export function TitleScreen() {
  const { load, hasSave, checkSave, stats } = useGameStore();
  const shards = useMetaStore((s) => s.shards);
  const refreshMeta = useMetaStore((s) => s.refresh);
  const getDailyBoard = useMetaStore((s) => s.getDailyBoard);
  const [showArt, setShowArt] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [board, setBoard] = useState<DailyEntry[]>([]);
  const dailyKey = todayKey();

  useEffect(() => {
    checkSave();
    refreshMeta();
    setBoard(getDailyBoard(dailyKey));
    setTimeout(() => setShowArt(true), 100);
  }, [checkSave, refreshMeta, getDailyBoard, dailyKey]);

  useEffect(() => {
    if (showArt) {
      let i = 0;
      const timer = setInterval(() => {
        if (i <= SUBTITLE.length) {
          setTypedText(SUBTITLE.slice(0, i));
          i++;
        } else {
          clearInterval(timer);
          setTimeout(() => setShowButtons(true), 200);
        }
      }, 40);
      return () => clearInterval(timer);
    }
  }, [showArt]);

  const handleNewGame = () => {
    if (hasSave) {
      const ok = window.confirm('Start a new game? Your saved run will be deleted.');
      if (!ok) return;
    }
    useGameStore.getState().newGame();
  };

  const handleContinue = () => {
    load();
  };

  const handleDaily = () => {
    if (hasSave) {
      const ok = window.confirm('Start the daily challenge? Your saved run will be deleted.');
      if (!ok) return;
    }
    useGameStore.getState().startDaily(dailyKey);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
      <pre
        className={`text-terminal-green text-[6px] sm:text-[8px] md:text-xs leading-tight transition-opacity duration-500 ${
          showArt ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {TITLE_ART}
      </pre>

      <div className="text-center text-terminal-dim text-sm h-6">
        <span className="animate-pulse-glow">{typedText}</span>
        <span className="animate-blink">_</span>
      </div>

      {stats.bestFloor > 1 && (
        <div className="text-terminal-yellow text-xs tracking-widest">
          BEST: FLOOR {stats.bestFloor} • BOSSES: {stats.bossesKilled}
        </div>
      )}

      {showButtons && (
        <div className="flex flex-col gap-3 w-64 animate-slide-up">
          <Button size="lg" glow onClick={handleNewGame}>
            {'> New Game'}
          </Button>
          {hasSave && (
            <Button size="lg" onClick={handleContinue}>
              {'> Continue'}
            </Button>
          )}
          <Button size="lg" onClick={handleDaily}>
            {'> Daily Challenge'}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => useGameStore.getState().setScreen('meta')}>
            {shards > 0 ? `> Renown (${shards}◆)` : '> Renown'}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => useGameStore.getState().setScreen('bestiary')}>
            {'> Bestiary'}
          </Button>
        </div>
      )}

      {showButtons && (
        <Panel title={`Daily — ${dailyKey}`} titleAlign="center" className="w-64">
          {board.length === 0 ? (
            <div className="text-terminal-dim text-[11px] text-center">
              No attempts yet today. Same seed for everyone — how deep can you go?
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-[11px]">
              {board.slice(0, 5).map((e, i) => (
                <div key={`${e.ts}-${i}`} className="flex justify-between text-terminal-dim">
                  <span className="text-terminal-green">
                    {i + 1}. {e.name} <span className="text-terminal-dim">({e.classId})</span>
                  </span>
                  <span className="text-terminal-yellow">F{e.floor}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {showButtons && (
        <div className="text-terminal-dim text-xs mt-8 animate-fade-in text-center">
          <p>Dungeon: WASD/Arrows or tap • Combat: 1 attack, 2/Q/E skills, 3 potion, 5 guard • E descends</p>
          <p className="mt-1">Rest at the Inn to save. Shrines heal once. Elites drop bonus loot.</p>
          <div className="mt-2 flex justify-center">
            <SoundToggle />
          </div>
        </div>
      )}
    </div>
  );
}
