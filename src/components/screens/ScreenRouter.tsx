import { useGameStore } from '../../game/store/gameStore';
import { TitleScreen } from './TitleScreen';
import { ClassSelectScreen } from './ClassSelectScreen';
import { TownScreen } from './TownScreen';
import { DungeonScreen } from './DungeonScreen';
import { CombatScreen } from './CombatScreen';
import { InventoryScreen } from './InventoryScreen';
import { GameOverScreen } from './GameOverScreen';
import { ShopScreen } from './ShopScreen';
import { QuestBoardScreen } from './QuestBoardScreen';

const screenMap: Record<string, React.FC> = {
  title: TitleScreen,
  classSelect: ClassSelectScreen,
  town: TownScreen,
  dungeon: DungeonScreen,
  combat: CombatScreen,
  inventory: InventoryScreen,
  gameOver: GameOverScreen,
  shop: ShopScreen,
  questBoard: QuestBoardScreen,
};

export function ScreenRouter() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const ScreenComponent = screenMap[currentScreen] || TitleScreen;
  return <ScreenComponent />;
}
