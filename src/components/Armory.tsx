import React, { useState } from 'react';
import { CharacterClassId } from '../types/game';
import { CHARACTER_CLASSES } from '../data/characters';
import { StorageManager } from '../systems/storage';
import { soundEngine } from '../systems/audio';
import { ArrowLeft, Hammer, Sparkles, Check, Coins } from 'lucide-react';

export interface ArmoryProps {
  onBack: () => void;
}

export const Armory: React.FC<ArmoryProps> = ({ onBack }) => {
  const [selectedClassId, setSelectedClassId] = useState<CharacterClassId>('warrior');
  const [, setRefresh] = useState(0);

  const saveData = StorageManager.load();
  const currentProg = saveData.characters[selectedClassId];
  const currentDef = CHARACTER_CLASSES.find((c) => c.id === selectedClassId) || CHARACTER_CLASSES[0];

  const costs = [0, 150, 300, 550, 900];
  const nextCost = currentProg.weaponLevel < 5 ? costs[currentProg.weaponLevel] : null;

  const handleForge = () => {
    const success = StorageManager.upgradeWeapon(selectedClassId);
    if (success) {
      soundEngine.playLevelUp();
      setRefresh((r) => r + 1);
    }
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
          КОРОЛЕВСКАЯ КУЗНИЦА
        </h1>

        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-lg shadow-sm">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-stone-300 font-mono-numbers">
            Золото: <strong className="text-yellow-400 font-bold">{saveData.gold}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Class Selector List */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-amber-500/80 font-bold mb-1">
            ВЫБЕРИТЕ ОРУЖИЕ ДЛЯ КОВКИ:
          </label>
          {CHARACTER_CLASSES.map((cls) => {
            const prog = saveData.characters[cls.id];
            const isSelected = selectedClassId === cls.id;

            return (
              <button
                key={cls.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedClassId(cls.id);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hammer className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-medieval text-sm font-bold text-stone-100">
                      {cls.weaponName}
                    </h3>
                    <p className="text-[11px] text-stone-400">{cls.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono-numbers font-bold text-amber-400">
                    Уровень {prog.weaponLevel} / 5
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Forge Details */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between pb-6 border-b border-stone-800">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500/80 font-bold">
                Оружейный арсенал ({currentDef.name})
              </span>
              <h2 className="font-medieval text-3xl font-extrabold text-stone-100 mt-1">
                {currentDef.weaponName}
              </h2>
            </div>

            <div className="text-right">
              <span className="font-medieval text-2xl font-bold text-amber-400 font-mono-numbers">
                РАНГ {currentProg.weaponLevel} / 5
              </span>
              {currentProg.weaponLevel >= 2 && (
                <div className="flex items-center gap-1 text-[11px] text-sky-400 mt-1 justify-end font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Магическое свечение клинка</span>
                </div>
              )}
            </div>
          </div>

          {/* Weapon Tier Visualizer */}
          <div className="grid grid-cols-5 gap-3 my-6">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isUnlocked = lvl <= currentProg.weaponLevel;
              const isNext = lvl === currentProg.weaponLevel + 1;

              return (
                <div
                  key={lvl}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                      : isNext
                      ? 'bg-stone-950/80 border-stone-700 text-stone-300'
                      : 'bg-stone-950/30 border-stone-900 opacity-40 text-stone-600'
                  }`}
                >
                  <span className="block font-medieval text-lg font-bold mb-1">
                    {lvl === 1 ? 'I' : lvl === 2 ? 'II' : lvl === 3 ? 'III' : lvl === 4 ? 'IV' : 'V'}
                  </span>
                  <span className="text-[11px] font-mono-numbers">
                    +{Math.round((lvl - 1) * 15)}% Урона
                  </span>
                  {isUnlocked && (
                    <Check className="w-4 h-4 mx-auto mt-2 text-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Upgrade info card */}
          {nextCost ? (
            <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-stone-200">
                  Улучшить до Уровня {currentProg.weaponLevel + 1}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Увеличивает весь урон оружия на +15% и повышает скорость ударов.
                </p>
              </div>

              <button
                disabled={saveData.gold < nextCost}
                onClick={handleForge}
                className="py-3 px-6 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:opacity-40 disabled:hover:from-amber-600 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Hammer className="w-4 h-4" />
                <span>КОВАТЬ ЗА {nextCost} ЗОЛОТА</span>
              </button>
            </div>
          ) : (
            <div className="bg-stone-950/80 border border-emerald-900/60 p-4 rounded-xl text-center text-emerald-400 font-bold text-sm">
              ★ ОРУЖИЕ ДОСТИГЛО МАКСИМАЛЬНОГО 5 УРОВНЯ МАСТЕРСТВА! ★
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
