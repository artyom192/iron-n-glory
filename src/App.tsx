import React, { useState, useCallback, useMemo } from 'react';
import { AppScreen, GameMode, CharacterClassDef, ArenaId, CampaignStage, ArenaDef } from './types/game';
import { CHARACTER_CLASSES, getClassById } from './data/characters';
import { ARENAS, getArenaById } from './data/arenas';
import { CAMPAIGN_STAGES } from './data/campaign';
import { StorageManager } from './systems/storage';
import { Fighter } from './entities/Fighter';
import { soundEngine } from './systems/audio';

import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { CampaignMap } from './components/CampaignMap';
import { CharacterUpgrade } from './components/CharacterUpgrade';
import { Armory } from './components/Armory';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('MAIN_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active match configuration
  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>('courtyard');
  const [p1ClassDef, setP1ClassDef] = useState<CharacterClassDef>(CHARACTER_CLASSES[0]);
  const [p2ClassDef, setP2ClassDef] = useState<CharacterClassDef>(CHARACTER_CLASSES[1]);
  const [p1Name, setP1Name] = useState<string>('Игрок 1');
  const [p2Name, setP2Name] = useState<string>('Противник');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [currentCampaignStage, setCurrentCampaignStage] = useState<CampaignStage | null>(null);

  // Match active status
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<{
    isOver: boolean;
    winnerId: string | null;
    rewardXp?: number;
    rewardGold?: number;
    leveledUp?: boolean;
    newLevel?: number;
  }>({
    isOver: false,
    winnerId: null,
  });

  // Unique key to recreate canvas on rematch
  const [matchSessionKey, setMatchSessionKey] = useState<number>(1);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.enabled = next;
      const data = StorageManager.load();
      data.soundEnabled = next;
      StorageManager.save(data);
      return next;
    });
  }, []);

  // Prepare Fighter Entities for battle
  const { player1Entity, player2Entity, currentArena } = useMemo(() => {
    const saveData = StorageManager.load();
    const p1Prog = saveData.characters[p1ClassDef.id];
    const p2Prog = saveData.characters[p2ClassDef.id];
    const arena = getArenaById(selectedArenaId);

    const f1 = new Fighter({
      id: 'p1',
      name: p1Name,
      classDef: p1ClassDef,
      progress: p1Prog,
      x: arena.width * 0.25,
      y: arena.height * 0.5,
      facing: 1,
      isBot: false,
    });

    const f2 = new Fighter({
      id: 'p2',
      name: p2Name,
      classDef: p2ClassDef,
      progress: gameMode === 'LOCAL_VS' ? p2Prog : {
        level: currentCampaignStage ? currentCampaignStage.enemyLevel : 1,
        xp: 0,
        attributePoints: 0,
        upgrades: {
          hp: currentCampaignStage ? currentCampaignStage.enemyLevel * 2 : 0,
          attack: currentCampaignStage ? currentCampaignStage.enemyLevel : 0,
          defense: currentCampaignStage ? currentCampaignStage.enemyLevel : 0,
          speed: 0,
          attackSpeed: 0,
          abilityPower: 0,
        },
        weaponLevel: currentCampaignStage ? Math.min(5, Math.ceil(currentCampaignStage.enemyLevel / 1.5)) : 1,
      },
      x: arena.width * 0.75,
      y: arena.height * 0.5,
      facing: -1,
      isBot: gameMode !== 'LOCAL_VS',
    });

    return { player1Entity: f1, player2Entity: f2, currentArena: arena };
  }, [p1ClassDef, p2ClassDef, p1Name, p2Name, selectedArenaId, gameMode, currentCampaignStage, matchSessionKey]);

  // Handle battle completion
  const handleMatchEnd = useCallback((winnerId: string) => {
    if (winnerId === 'p1' && gameMode === 'CAMPAIGN' && currentCampaignStage) {
      // Award XP and Gold
      const { leveledUp, newLevel } = StorageManager.addXp(p1ClassDef.id, currentCampaignStage.rewardXp);
      StorageManager.addGold(currentCampaignStage.rewardGold);
      StorageManager.unlockNextStage(currentCampaignStage.stageNumber);

      setMatchResult({
        isOver: true,
        winnerId,
        rewardXp: currentCampaignStage.rewardXp,
        rewardGold: currentCampaignStage.rewardGold,
        leveledUp,
        newLevel,
      });
    } else {
      setMatchResult({
        isOver: true,
        winnerId,
      });
    }
  }, [gameMode, currentCampaignStage, p1ClassDef]);

  // Restart match (ЕЩЁ БОЙ)
  const handleRematch = useCallback(() => {
    setIsPaused(false);
    setMatchResult({ isOver: false, winnerId: null });
    setMatchSessionKey((k) => k + 1);
  }, []);

  // Campaign: Next Stage
  const handleNextStage = useCallback(() => {
    if (!currentCampaignStage) return;
    const nextIndex = currentCampaignStage.stageNumber; // 0-based next is stageNumber
    if (nextIndex < CAMPAIGN_STAGES.length) {
      const nextStage = CAMPAIGN_STAGES[nextIndex];
      setCurrentCampaignStage(nextStage);
      setSelectedArenaId(nextStage.arenaId);
      setP2ClassDef(getClassById(nextStage.enemyClass));
      setP2Name(nextStage.enemyName);
      setAiDifficulty(nextStage.aiDifficulty);
      setIsPaused(false);
      setMatchResult({ isOver: false, winnerId: null });
      setMatchSessionKey((k) => k + 1);
    } else {
      // Completed all campaign! Return to map
      setScreen('CAMPAIGN_MAP');
    }
  }, [currentCampaignStage]);

  // Start campaign stage from map
  const handleStartCampaignStage = useCallback((stage: CampaignStage, playerHero: CharacterClassDef) => {
    setGameMode('CAMPAIGN');
    setCurrentCampaignStage(stage);
    setSelectedArenaId(stage.arenaId);
    setP1ClassDef(playerHero);
    setP1Name(playerHero.name);
    setP2ClassDef(getClassById(stage.enemyClass));
    setP2Name(stage.enemyName);
    setAiDifficulty(stage.aiDifficulty);
    setIsPaused(false);
    setMatchResult({ isOver: false, winnerId: null });
    setMatchSessionKey((k) => k + 1);
    setScreen('BATTLE');
  }, []);

  // Start battle from character selector (Local VS or Practice)
  const handleStartCustomBattle = useCallback((
    p1Def: CharacterClassDef,
    p2Def: CharacterClassDef,
    arenaId: ArenaId,
    diff: 'easy' | 'normal' | 'hard'
  ) => {
    setSelectedArenaId(arenaId);
    setP1ClassDef(p1Def);
    setP1Name(gameMode === 'LOCAL_VS' ? 'Игрок 1' : p1Def.name);
    setP2ClassDef(p2Def);
    setP2Name(gameMode === 'LOCAL_VS' ? 'Игрок 2' : `${p2Def.name} (Бот)`);
    setAiDifficulty(diff);
    setCurrentCampaignStage(null);
    setIsPaused(false);
    setMatchResult({ isOver: false, winnerId: null });
    setMatchSessionKey((k) => k + 1);
    setScreen('BATTLE');
  }, [gameMode]);

  // Current gold from save
  const gold = StorageManager.load().gold;

  return (
    <div className="w-screen h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Screen Router */}
      {screen === 'MAIN_MENU' && (
        <MainMenu
          onStartCampaign={() => setScreen('CAMPAIGN_MAP')}
          onStartVs={() => {
            setGameMode('LOCAL_VS');
            setScreen('CHARACTER_SELECT');
          }}
          onStartPractice={() => {
            setGameMode('PRACTICE');
            setScreen('CHARACTER_SELECT');
          }}
          onOpenCharacters={() => setScreen('CHARACTER_UPGRADE')}
          onOpenArmory={() => setScreen('ARMORY')}
          gold={gold}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {screen === 'CAMPAIGN_MAP' && (
        <CampaignMap
          onSelectStage={handleStartCampaignStage}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {screen === 'CHARACTER_SELECT' && (
        <CharacterSelect
          gameMode={gameMode}
          onConfirm={handleStartCustomBattle}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {screen === 'CHARACTER_UPGRADE' && (
        <CharacterUpgrade onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'ARMORY' && (
        <Armory onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'BATTLE' && (
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          <GameCanvas
            key={matchSessionKey}
            arena={currentArena}
            player1={player1Entity}
            player2={player2Entity}
            gameMode={gameMode}
            aiDifficulty={aiDifficulty}
            onMatchEnd={handleMatchEnd}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
          />

          <HUD
            p1={player1Entity}
            p2={player2Entity}
            gameMode={gameMode}
            matchResult={matchResult}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
            onRematch={handleRematch}
            onNextStage={gameMode === 'CAMPAIGN' ? handleNextStage : undefined}
            onGoToMenu={() => setScreen('MAIN_MENU')}
            onGoToUpgrade={() => setScreen('CHARACTER_UPGRADE')}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
        </div>
      )}
    </div>
  );
}
