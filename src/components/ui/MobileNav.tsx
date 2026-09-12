import { Button } from '../ui/Button';

interface MobileNavProps {
  onMove: (dx: number, dy: number) => void;
  canMove: { up: boolean; down: boolean; left: boolean; right: boolean };
}

export function MobileNav({ onMove, canMove }: MobileNavProps) {
  return (
    <div className="lg:hidden flex flex-col items-center gap-1 mt-4">
      <div className="text-terminal-dim text-[10px] mb-1">TOUCH NAV</div>
      <div className="grid grid-cols-3 gap-1 w-32">
        <div />
        <Button size="sm" onClick={() => onMove(0, -1)} disabled={!canMove.up}>
          {'^'}
        </Button>
        <div />
        <Button size="sm" onClick={() => onMove(-1, 0)} disabled={!canMove.left}>
          {'<'}
        </Button>
        <div className="w-8" />
        <Button size="sm" onClick={() => onMove(1, 0)} disabled={!canMove.right}>
          {'>'}
        </Button>
        <div />
        <Button size="sm" onClick={() => onMove(0, 1)} disabled={!canMove.down}>
          {'v'}
        </Button>
        <div />
      </div>
    </div>
  );
}
