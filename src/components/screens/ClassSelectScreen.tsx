import { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { CLASSES } from '../../game/data/classes';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';

export function ClassSelectScreen() {
  const { createPlayer } = useGameStore();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const selected = CLASSES.find((c) => c.id === selectedClass);

  const handleClassClick = (classId: string) => {
    setSelectedClass(classId);
    setShowNameInput(false);
    setPlayerName('');
  };

  const handleConfirm = () => {
    if (selectedClass && playerName.trim()) {
      createPlayer(playerName.trim(), selectedClass);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-terminal-cyan text-xl tracking-widest uppercase mb-2">
          Choose Your Class
        </h1>
        <p className="text-terminal-dim text-sm">
          Each class has unique strengths and abilities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
        {CLASSES.map((cls) => (
          <Panel
            key={cls.id}
            title={cls.name}
            className={`cursor-pointer transition-all duration-200 ${
              selectedClass === cls.id
                ? 'border-terminal-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                : 'hover:border-terminal-green'
            }`}
          >
            <button
              onClick={() => handleClassClick(cls.id)}
              className="w-full text-left"
            >
              <div className="flex gap-3">
                <pre className="text-terminal-green text-[10px] leading-tight whitespace-pre">
                  {cls.ascii}
                </pre>
                <div className="flex-1">
                  <p className="text-terminal-dim text-xs mb-2">{cls.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-terminal-dim">STR</span>
                      <span className="text-terminal-red">{cls.baseStats.str}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-dim">DEX</span>
                      <span className="text-terminal-yellow">{cls.baseStats.dex}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-dim">INT</span>
                      <span className="text-terminal-cyan">{cls.baseStats.int}</span>
                    </div>
                    <ProgressBar
                      current={cls.baseStats.hp}
                      max={cls.baseStats.maxHp}
                      label="HP"
                      color="red"
                    />
                    <ProgressBar
                      current={cls.baseStats.mp}
                      max={cls.baseStats.maxMp}
                      label="MP"
                      color="cyan"
                    />
                  </div>
                </div>
              </div>
            </button>
          </Panel>
        ))}
      </div>

      {selectedClass && !showNameInput && (
        <div className="flex justify-center">
          <Button onClick={() => setShowNameInput(true)}>
            {'> Select ' + selected?.name}
          </Button>
        </div>
      )}

      {showNameInput && selected && (
        <Panel title="Enter Your Name" className="max-w-md mx-auto w-full">
          <div className="flex flex-col gap-3">
            <div className="text-terminal-dim text-xs">
              Playing as: <span className="text-terminal-cyan">{selected.name}</span>
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="Enter name..."
              maxLength={16}
              autoFocus
              className="bg-transparent border border-terminal-green px-3 py-2 text-terminal-green
                         font-mono text-sm outline-none focus:border-terminal-cyan
                         placeholder:text-terminal-dim"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowNameInput(false)}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={!playerName.trim()}>
                {'> Begin Adventure'}
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
