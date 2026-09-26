import { useState } from 'react';
import { Button } from '../ui/Button';
import { hasSeenTutorial, markTutorialSeen } from '../../utils/tutorial';

const STEPS = [
  'MOVE with WASD / arrows or tap. Rooms reveal as you step.',
  'FIGHT monsters (◆), dodge traps (×), loot treasure (●). Boss (▲) gates stairs every 5 floors.',
  'DESCEND with E on stairs (▼). Rest at Inn, forge at Smithy, track feats in Achievements.',
];

export function TutorialOverlay({ where }: { where: 'town' | 'dungeon' }) {
  const [dismissed, setDismissed] = useState(() => hasSeenTutorial());
  const [step, setStep] = useState(0);
  if (dismissed) return null;

  const close = () => {
    markTutorialSeen();
    setDismissed(true);
  };

  return (
    <div className="border border-terminal-cyan/60 bg-terminal-bg/95 px-3 py-2 text-xs" role="dialog" aria-label="Tutorial">
      <div className="text-terminal-cyan tracking-widest text-[11px]">GUIDE ({step + 1}/{STEPS.length}) · {where.toUpperCase()}</div>
      <div className="text-terminal-green mt-1">{STEPS[step]}</div>
      <div className="flex gap-2 mt-2">
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Button size="sm" onClick={close}>Got it</Button>
        )}
        <Button size="sm" variant="ghost" onClick={close}>Skip</Button>
      </div>
    </div>
  );
}
