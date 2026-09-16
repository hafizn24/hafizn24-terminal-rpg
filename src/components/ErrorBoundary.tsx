import { Component, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defense: one render throw in a screen used to blank the whole
 * app. Now it shows a terminal-styled crash panel that never touches the save
 * (the save is only written on explicit game actions, so it stays intact).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('Terminal RPG crashed:', error);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleTitle = (): void => {
    this.setState({ error: null });
    window.location.hash = '';
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in p-4">
        <Panel title="> FATAL EXCEPTION" className="max-w-md w-full text-center">
          <p className="text-terminal-red text-sm mb-2">The dungeon glitched out of existence.</p>
          <p className="text-terminal-dim text-[11px] mb-1 break-words">
            {this.state.error.message || String(this.state.error)}
          </p>
          <p className="text-terminal-dim text-[11px]">
            Your save is untouched — reload to return to your last checkpoint.
          </p>
        </Panel>
        <div className="flex gap-2">
          <Button glow onClick={this.handleReload}>
            {'> Reload'}
          </Button>
          <Button variant="ghost" onClick={this.handleTitle}>
            {'> Title'}
          </Button>
        </div>
      </div>
    );
  }
}
