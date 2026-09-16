import { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { generateDailyQuests, generateSideQuests, checkDailyReset } from '../../game/systems/questSystem';

const DAILY_RESET_KEY = 'terminal_rpg_daily_reset';

export function QuestBoardScreen() {
  const { player, quests, setQuests, updatePlayer, setScreen } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);
  const [tab, setTab] = useState<'active' | 'available'>('active');

  useEffect(() => {
    const storedDate = localStorage.getItem(DAILY_RESET_KEY);
    const storeQuests = useGameStore.getState().quests;

    if (checkDailyReset(storedDate || '')) {
      const newDaily = generateDailyQuests();
      const nonDaily = storeQuests.filter((q) => q.type !== 'daily');
      // Merge by id so progress on side quests is preserved across daily resets.
      const merged = [...nonDaily];
      newDaily.forEach((dq) => {
        if (!merged.find((q) => q.id === dq.id)) merged.push(dq);
      });
      setQuests(merged);
      localStorage.setItem(DAILY_RESET_KEY, new Date().toISOString());
      useGameStore.getState().save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable side-quest offers: snapshot the floor on mount so the list doesn't
  // regenerate on every floor change and invalidate Accept buttons.
  const mountFloor = useRef(player?.floor ?? 1);
  const availableQuests = useMemo(() => generateSideQuests(mountFloor.current), []);

  if (!player) return null;

  // Show completed-but-unclaimed quests with a Claim button (previously
  // `!completed` filtered them out, making Claim unreachable).
  const activeQuests = quests;
  const claimableCount = quests.filter((q) => q.completed).length;

  const handleAccept = (quest: typeof quests[0]) => {
    if (quests.find((q) => q.id === quest.id)) return;
    setQuests([...quests, { ...quest, progress: 0, completed: false }]);
    useGameStore.getState().save();
    addLog(`Accepted quest: ${quest.name}`, 'system');
  };

  const handleClaim = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !quest.completed) return;

    updatePlayer({ gold: player.gold + quest.reward.gold });
    const levelMsgs = useGameStore.getState().gainExp(quest.reward.exp);
    levelMsgs.forEach((m) => addLog(m, 'loot'));

    if (quest.reward.itemId) {
      useGameStore.getState().addItem(quest.reward.itemId, 1);
      addLog(`Quest item reward: ${quest.reward.itemId.replace(/_/g, ' ')}!`, 'loot');
    }

    setQuests(quests.filter((q) => q.id !== questId));
    useGameStore.getState().save();
    addLog(`Claimed rewards: ${quest.reward.gold} gold, ${quest.reward.exp} EXP!`, 'loot');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">
          Guild Board
        </h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          {'[Back to Town]'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === 'active' ? 'primary' : 'ghost'}
          onClick={() => setTab('active')}
        >
          Active ({activeQuests.length}{claimableCount > 0 ? `, ${claimableCount} ready` : ''})
        </Button>
        <Button
          size="sm"
          variant={tab === 'available' ? 'primary' : 'ghost'}
          onClick={() => setTab('available')}
        >
          Available
        </Button>
      </div>

      {tab === 'active' && (
        <Panel title="Active Quests">
          {activeQuests.length === 0 ? (
            <div className="text-terminal-dim text-xs italic">
              No active quests. Check the Available tab.
            </div>
          ) : (
            <div className="space-y-3">
              {activeQuests.map((quest) => (
                <div key={quest.id} className="border-b border-terminal-dim/30 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-terminal-yellow text-sm">{quest.name}</span>
                    <span className="text-terminal-dim text-[10px] uppercase">
                      {quest.type}{quest.completed ? ' • READY' : ''}
                    </span>
                  </div>
                  <div className="text-terminal-dim text-xs mb-2">{quest.description}</div>
                  <div className="text-[11px] text-terminal-dim mb-1">
                    Progress: <span className="text-terminal-green">{quest.progress}/{quest.objective.required}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-terminal-dim text-[10px]">
                      Reward: {quest.reward.gold}g, {quest.reward.exp} EXP
                      {quest.reward.itemId ? `, ${quest.reward.itemId.replace(/_/g, ' ')}` : ''}
                    </div>
                    {quest.completed && (
                      <Button size="sm" onClick={() => handleClaim(quest.id)} glow>
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'available' && (
        <Panel title="Available Quests">
          <div className="space-y-3">
            {availableQuests.map((quest) => {
              const alreadyAccepted = quests.find((q) => q.id === quest.id);
              return (
                <div key={quest.id} className="border-b border-terminal-dim/30 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-terminal-yellow text-sm">{quest.name}</span>
                    <span className="text-terminal-dim text-[10px] uppercase">side</span>
                  </div>
                  <div className="text-terminal-dim text-xs mb-2">{quest.description}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-terminal-dim text-[10px]">
                      Reward: {quest.reward.gold}g, {quest.reward.exp} EXP
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(quest)}
                      disabled={!!alreadyAccepted}
                    >
                      {alreadyAccepted ? 'Accepted' : 'Accept'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
