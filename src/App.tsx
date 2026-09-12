import { TerminalWindow } from './components/terminal/TerminalWindow';
import { StatusBar } from './components/terminal/StatusBar';
import { ScreenRouter } from './components/screens/ScreenRouter';
import { useGameStore } from './game/store/gameStore';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const showStatusBar = currentScreen !== 'title' && currentScreen !== 'classSelect' && currentScreen !== 'gameOver';

  return (
    <TerminalWindow>
      <ScreenRouter />
      {showStatusBar && <StatusBar />}
    </TerminalWindow>
  );
}
