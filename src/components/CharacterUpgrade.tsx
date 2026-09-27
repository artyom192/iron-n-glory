import React, { useState } from 'react';
import { CharacterClassId } from '../types/game';
import { CHARACTER_CLASSES } from '../data/characters';
import { StorageManager } from '../systems/storage';
import { soundEngine } from '../systems/audio';
import { ArrowLeft, Plus, Shield, Zap, Heart, Activity, Sparkles } from 'lucide-react';

export interface CharacterUpgradeProps {
  onBack: () => void;
}

export const CharacterUpgrade: React.FC<CharacterUpgradeProps> = ({ onBack }) => {
  const [selectedClassId, setSelectedClassId] = useState<CharacterClassId>('warrior');
  const [, setRefresh] = useState(0);

  const saveData = StorageManager.load();
  const currentProg = saveData.characters[selectedClassId];
  const currentDef = CHARACTER_CLASSES.find((c) => c.id === selectedClassId) || CHARACTER_CLASSES[0];

  const neededXp = StorageManager.getXpForNextLevel(currentProg.level);
  const xpPercent = Math.min(100, Math.round((currentProg.xp / neededXp) * 100));

  const handleUpgrade = (stat: 'hp' | 'attack' | 'defense' | 'speed' | 'attackSpeed' | 'abilityPower') => {
    const success = StorageManager.upgradeAttribute(selectedClassId, stat);
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
          ПРОКАЧКА ПЕРСОНАЖЕЙ
        </h1>

        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-stone-300 font-mono-numbers">
            Очки прокачки: <strong className="text-amber-400">{currentProg.attributePoints}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Class Selector List */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-amber-500/80 font-bold mb-1">
            ВЫБЕРИТЕ КЛАСС ДЛЯ УЛУЧШЕНИЯ:
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
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: cls.visuals.primaryColor }}
                  />
                  <div>
                    <h3 className="font-medieval text-sm font-bold text-stone-100">
                      {cls.name}
                    </h3>
                    <p className="text-[11px] text-stone-400">{cls.weaponName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono-numbers font-bold text-amber-400">
                    Ур. {prog.level}
                  </span>
                  {prog.attributePoints > 0 && (
                    <span className="block text-[10px] text-emerald-400 font-bold">
                      +{prog.attributePoints} очков
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Hero Stats & Upgrade Points Spending */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
          {/* Hero Banner Header */}
          <div className="flex items-center justify-between pb-6 border-b border-stone-800">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500/80 font-bold">
                {currentDef.title}
              </span>
              <h2 className="font-medieval text-3xl font-extrabold text-stone-100 mt-1">
                {currentDef.name}
              </h2>
            </div>

            <div className="text-right">
              <span className="font-medieval text-3xl font-black text-amber-400 font-mono-numbers">
                УРОВЕНЬ {currentProg.level}
              </span>
              <div className="w-48 mt-2">
                <div className="flex justify-between text-[11px] text-stone-400 mb-1 font-mono-numbers">
                  <span>Опыт</span>
                  <span>{currentProg.xp} / {neededXp} XP</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Points Available Banner */}
          <div className="my-5 p-3.5 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-stone-300">
              Доступные очки характеристик:
            </span>
            <span className="font-mono-numbers text-xl font-bold text-amber-400">
              {currentProg.attributePoints}
            </span>
          </div>

          {/* Stat Upgrade Rows */}
          <div className="space-y-3.5">
            {/* 1. Health */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-stone-200">Здоровье (HP)</span>
                </div>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  Текущее: {currentDef.baseStats.maxHp + currentProg.upgrades.hp * 18} (+{currentProg.upgrades.hp * 18})
                </span>
              </div>
              <button
                disabled={currentProg.attributePoints <= 0 || currentProg.upgrades.hp >= 20}
                onClick={() => handleUpgrade('hp')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-100 hover:text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+18 HP</span>
              </button>
            </div>

            {/* 2. Attack */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-stone-200">Сила атаки (Attack)</span>
                </div>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  Текущий урон: {currentDef.baseStats.attack + currentProg.upgrades.attack * 4} (+{currentProg.upgrades.attack * 4})
                </span>
              </div>
              <button
                disabled={currentProg.attributePoints <= 0 || currentProg.upgrades.attack >= 20}
                onClick={() => handleUpgrade('attack')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-100 hover:text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+4 Урона</span>
              </button>
            </div>

            {/* 3. Defense */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-stone-200">Защита (Defense)</span>
                </div>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  Текущая броня: {Math.round(currentDef.baseStats.defense + currentProg.upgrades.defense * 2.5)} (+{Math.round(currentProg.upgrades.defense * 2.5)})
                </span>
              </div>
              <button
                disabled={currentProg.attributePoints <= 0 || currentProg.upgrades.defense >= 15}
                onClick={() => handleUpgrade('defense')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-100 hover:text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+2.5 Защиты</span>
              </button>
            </div>

            {/* 4. Speed */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-stone-200">Скорость движения</span>
                </div>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  Текущая скорость: {currentDef.baseStats.speed + currentProg.upgrades.speed * 8}
                </span>
              </div>
              <button
                disabled={currentProg.attributePoints <= 0 || currentProg.upgrades.speed >= 10}
                onClick={() => handleUpgrade('speed')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-100 hover:text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+8 Скорости</span>
              </button>
            </div>

            {/* 5. Ability Power */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-stone-200">Мощь способности</span>
                </div>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  Множитель урона: {(currentDef.baseStats.abilityPower + currentProg.upgrades.abilityPower * 0.12).toFixed(2)}x
                </span>
              </div>
              <button
                disabled={currentProg.attributePoints <= 0 || currentProg.upgrades.abilityPower >= 15}
                onClick={() => handleUpgrade('abilityPower')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-100 hover:text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+0.12x Мощи</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
