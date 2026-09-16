import { TerminalWindow } from './components/terminal/TerminalWindow';
import { StatusBar } from './components/terminal/StatusBar';
import { ScreenRouter } from './components/screens/ScreenRouter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGameStore } from './game/store/gameStore';

const CHROMELESS: string[] = ['title', 'classSelect', 'gameOver', 'ending'];

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const showStatusBar = !CHROMELESS.includes(currentScreen);

  return (
    <TerminalWindow>
      <ErrorBoundary>
        <ScreenRouter />
      </ErrorBoundary>
      {showStatusBar && <StatusBar />}
    </TerminalWindow>
  );
}
