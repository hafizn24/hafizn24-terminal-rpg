import { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { CLASSES } from '../../game/data/classes';
import { Button } from '../ui/Button';
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

  const classIcons: Record<string, string> = {
    warrior: '[SWORD]',
    mage: '[STAFF]',
    rogue: '[BLADE]',
    cleric: '[SHIELD]',
  };

  const classColors: Record<string, string> = {
    warrior: 'text-terminal-red',
    mage: 'text-terminal-cyan',
    rogue: 'text-terminal-yellow',
    cleric: 'text-terminal-green',
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-terminal-cyan text-xl tracking-widest uppercase mb-2">
          Choose Your Class
        </h1>
        <p className="text-terminal-dim text-sm">
          Each class has unique strengths and abilities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CLASSES.map((cls) => (
          <button
            key={cls.id}
            onClick={() => handleClassClick(cls.id)}
            className={`text-left p-3 border transition-all duration-200 ${
              selectedClass === cls.id
                ? 'border-terminal-cyan bg-terminal-cyan/10'
                : 'border-terminal-dim hover:border-terminal-green'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs ${classColors[cls.id]}`}>
                {classIcons[cls.id]}
              </span>
              <span className="text-terminal-green text-sm font-bold uppercase">
                {cls.name}
              </span>
            </div>

            <p className="text-terminal-dim text-xs mb-3 leading-relaxed">
              {cls.description}
            </p>

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
              <ProgressBar current={cls.baseStats.hp} max={cls.baseStats.maxHp} label="HP" color="red" />
              <ProgressBar current={cls.baseStats.mp} max={cls.baseStats.maxMp} label="MP" color="cyan" />
            </div>

            <div className="mt-2 pt-2 border-t border-terminal-dim/30">
              <span className="text-terminal-dim text-[10px]">SKILL: </span>
              <span className="text-terminal-green text-[10px]">{cls.skill.name}</span>
            </div>
          </button>
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
        <div className="border border-terminal-green p-4 max-w-md mx-auto w-full">
          <div className="text-terminal-cyan text-xs uppercase tracking-widest mb-3">
            [ Enter Your Name ]
          </div>
          <div className="text-terminal-dim text-xs mb-3">
            Playing as: <span className="text-terminal-green">{selected.name}</span>
          </div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder="Enter name..."
            maxLength={16}
            autoFocus
            className="w-full bg-transparent border border-terminal-green px-3 py-2 text-terminal-green
                       font-mono text-sm outline-none focus:border-terminal-cyan
                       placeholder:text-terminal-dim mb-3"
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
      )}
    </div>
  );
}
