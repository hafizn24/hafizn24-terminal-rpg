import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { generateDailyQuests, generateSideQuests, checkDailyReset } from '../../game/systems/questSystem';

export function QuestBoardScreen() {
  const { player, quests, setQuests, updatePlayer, setScreen } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);
  const [tab, setTab] = useState<'active' | 'available'>('active');

  useEffect(() => {
    const stored = localStorage.getItem('terminal_rpg_quests');
    const storedDate = localStorage.getItem('terminal_rpg_daily_reset');

    if (checkDailyReset(storedDate || '')) {
      const newDaily = generateDailyQuests();
      const existing = stored ? JSON.parse(stored) : [];
      const nonDaily = existing.filter((q: { type: string }) => q.type !== 'daily');
      setQuests([...nonDaily, ...newDaily]);
      localStorage.setItem('terminal_rpg_daily_reset', new Date().toISOString());
    } else if (stored && quests.length === 0) {
      setQuests(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (quests.length > 0) {
      localStorage.setItem('terminal_rpg_quests', JSON.stringify(quests));
    }
  }, [quests]);

  const playerFloor = player?.floor ?? 1;
  const availableQuests = useMemo(() => generateSideQuests(playerFloor), [playerFloor]);

  if (!player) return null;

  const activeQuests = quests.filter((q) => !q.completed);

  const handleAccept = (quest: typeof quests[0]) => {
    if (quests.find((q) => q.name === quest.name)) return;
    setQuests([...quests, quest]);
    addLog(`Accepted quest: ${quest.name}`, 'system');
  };

  const handleClaim = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !quest.completed) return;

    updatePlayer({
      gold: player.gold + quest.reward.gold,
      exp: player.exp + quest.reward.exp,
    });

    setQuests(quests.filter((q) => q.id !== questId));
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
          Active ({activeQuests.length})
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
                    <span className="text-terminal-dim text-[10px] uppercase">{quest.type}</span>
                  </div>
                  <div className="text-terminal-dim text-xs mb-2">{quest.description}</div>
                  <ProgressBar
                    current={quest.progress}
                    max={quest.objective.required}
                    label=""
                    color="green"
                    showText={true}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-terminal-dim text-[10px]">
                      Reward: {quest.reward.gold}g, {quest.reward.exp} EXP
                    </div>
                    {quest.completed && (
                      <Button size="sm" onClick={() => handleClaim(quest.id)}>
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
              const alreadyAccepted = quests.find((q) => q.name === quest.name);
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
