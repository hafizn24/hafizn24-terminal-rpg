import { useState } from 'react';
import { isMuted, playSfx, setMuted } from '../../utils/audio';
import { Button } from './Button';

export function SoundToggle() {
  const [muted, setMutedState] = useState(() => isMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playSfx('click');
  };

  return (
    <Button size="sm" variant="ghost" onClick={toggle} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
      {muted ? 'Sound: off' : 'Sound: on'}
    </Button>
  );
}
