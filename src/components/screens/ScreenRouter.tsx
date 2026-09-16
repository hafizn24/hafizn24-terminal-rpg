import { useGameStore } from '../../game/store/gameStore';
import { TitleScreen } from './TitleScreen';
import { ClassSelectScreen } from './ClassSelectScreen';
import { TownScreen } from './TownScreen';
import { DungeonScreen } from './DungeonScreen';
import { CombatScreen } from './CombatScreen';
import { InventoryScreen } from './InventoryScreen';
import { StatsScreen } from './StatsScreen';
import { GameOverScreen } from './GameOverScreen';
import { ShopScreen } from './ShopScreen';
import { QuestBoardScreen } from './QuestBoardScreen';
import { MetaScreen } from './MetaScreen';
import { BestiaryScreen } from './BestiaryScreen';
import { RelicDraftScreen } from './RelicDraftScreen';
import { EndingScreen } from './EndingScreen';

const screenMap: Record<string, React.FC> = {
  title: TitleScreen,
  classSelect: ClassSelectScreen,
  town: TownScreen,
  dungeon: DungeonScreen,
  combat: CombatScreen,
  inventory: InventoryScreen,
  stats: StatsScreen,
  gameOver: GameOverScreen,
  shop: ShopScreen,
  questBoard: QuestBoardScreen,
  meta: MetaScreen,
  bestiary: BestiaryScreen,
  relicDraft: RelicDraftScreen,
  ending: EndingScreen,
};

export function ScreenRouter() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const ScreenComponent = screenMap[currentScreen] || TitleScreen;
  return <ScreenComponent />;
}
