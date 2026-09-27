import React, { useState } from 'react';
import { CAMPAIGN_STAGES } from '../data/campaign';
import { CampaignStage, CharacterClassDef, CharacterClassId } from '../types/game';
import { StorageManager } from '../systems/storage';
import { CHARACTER_CLASSES } from '../data/characters';
import { soundEngine } from '../systems/audio';
import { ArrowLeft, Lock, CheckCircle2, Swords, Skull, Trophy } from 'lucide-react';

export interface CampaignMapProps {
  onSelectStage: (stage: CampaignStage, playerClass: CharacterClassDef) => void;
  onBack: () => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({
  onSelectStage,
  onBack,
}) => {
  const saveData = StorageManager.load();
  const unlocked = saveData.campaignStageUnlocked;

  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(
    Math.min(unlocked - 1, CAMPAIGN_STAGES.length - 1)
  );
  const [selectedHeroId, setSelectedHeroId] = useState<CharacterClassId>('warrior');

  const currentStage = CAMPAIGN_STAGES[selectedStageIndex];
  const selectedHero = CHARACTER_CLASSES.find((c) => c.id === selectedHeroId) || CHARACTER_CLASSES[0];

  const handleStart = () => {
    soundEngine.playClick();
    onSelectStage(currentStage, selectedHero);
  };

  return (
    <div className="relative w-full min-h-screen bg-stone-950 p-6 flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between border-b border-stone-800 pb-4">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-100 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>НАЗАД В МЕНЮ</span>
        </button>

        <h1 className="font-medieval text-2xl md:text-3xl font-bold text-amber-400">
          ОДИНОЧНАЯ КАМПАНИЯ
        </h1>

        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-stone-300 font-mono-numbers">
            Открыто: {unlocked} / 6
          </span>
        </div>
      </div>

      {/* Main Campaign Grid */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stages Timeline List */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-wider text-amber-500/80 font-bold mb-1">
            ВЫБЕРИТЕ ЭТАП БИТВЫ:
          </h2>

          <div className="space-y-3">
            {CAMPAIGN_STAGES.map((stg, idx) => {
              const isUnlocked = stg.stageNumber <= unlocked;
              const isCompleted = stg.stageNumber < unlocked;
              const isSelected = selectedStageIndex === idx;

              return (
                <button
                  key={stg.stageNumber}
                  disabled={!isUnlocked}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedStageIndex(idx);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                      : isUnlocked
                      ? 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                      : 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-medieval font-bold ${
                      isCompleted
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : isUnlocked
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-stone-900 text-stone-600 border border-stone-800'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : !isUnlocked ? <Lock className="w-4 h-4" /> : stg.stageNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medieval text-base font-bold text-stone-100">
                          {stg.title}
                        </span>
                        {stg.stageNumber === 6 && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded">
                            БОСС
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Враг: {stg.enemyName} (Ур. {stg.enemyLevel}) · Сложность: {
                          stg.aiDifficulty === 'easy' ? 'Легкая' : stg.aiDifficulty === 'normal' ? 'Средняя' : 'Сложная'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-mono-numbers text-amber-400 font-bold">
                      +{stg.rewardGold} Золота
                    </span>
                    <span className="text-[11px] font-mono-numbers text-stone-500">
                      +{stg.rewardXp} XP
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail & Hero Picker */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-5 h-5 text-red-400" />
              <span className="text-xs uppercase tracking-wider text-red-400 font-bold">
                Информация о битве
              </span>
            </div>

            <h3 className="font-medieval text-2xl font-bold text-stone-100">
              {currentStage.title}
            </h3>
            <p className="text-sm text-stone-300 mt-2 leading-relaxed">
              {currentStage.description}
            </p>

            {/* Enemy specs */}
            <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl my-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-stone-400">Противник:</span>
                <span className="font-bold text-stone-200">{currentStage.enemyName}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-stone-400">Класс врага:</span>
                <span className="font-bold text-amber-400 capitalize">{currentStage.enemyClass}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Сложность AI:</span>
                <span className="font-bold uppercase text-red-400">{currentStage.aiDifficulty}</span>
              </div>
            </div>

            {/* Choose Your Fighter */}
            <div className="mt-4">
              <label className="block text-xs uppercase tracking-wider text-amber-500/80 font-bold mb-2">
                ВЫБЕРИТЕ СВОЕГО ГЕРОЯ:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHARACTER_CLASSES.map((cls) => {
                  const isSel = selectedHeroId === cls.id;
                  const prog = saveData.characters[cls.id];
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedHeroId(cls.id);
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        isSel
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span className="block text-xs font-bold truncate">{cls.name}</span>
                      <span className="block text-[10px] text-stone-500 font-mono-numbers">
                        Ур. {prog.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="mt-8 pt-4 border-t border-stone-800">
            <button
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-medieval font-black text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <Swords className="w-6 h-6 text-stone-950" />
              <span>НАЧАТЬ ЭТАП {currentStage.stageNumber}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
