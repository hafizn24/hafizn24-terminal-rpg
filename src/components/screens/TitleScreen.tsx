import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { Button } from '../ui/Button';

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
  const { load, hasSave, checkSave } = useGameStore();
  const [showArt, setShowArt] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    checkSave();
    setTimeout(() => setShowArt(true), 100);
  }, [checkSave]);

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
    useGameStore.getState().newGame();
  };

  const handleContinue = () => {
    load();
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
        </div>
      )}

      {showButtons && (
        <div className="text-terminal-dim text-xs mt-8 animate-fade-in">
          <p>WASD to navigate. Click to interact.</p>
          <p className="mt-1">v0.1.0 — Built with React</p>
        </div>
      )}
    </div>
  );
}
