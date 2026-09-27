import React, { useState } from 'react';
import { CharacterClassDef, CharacterClassId, GameMode, ArenaId } from '../types/game';
import { CHARACTER_CLASSES } from '../data/characters';
import { ARENAS } from '../data/arenas';
import { StorageManager } from '../systems/storage';
import { soundEngine } from '../systems/audio';
import { Shield, Zap, Target, Flame, RotateCw, Axe, ArrowLeft, Swords, Heart, Activity } from 'lucide-react';

export interface CharacterSelectProps {
  gameMode: GameMode;
  onConfirm: (
    p1Class: CharacterClassDef,
    p2Class: CharacterClassDef,
    arenaId: ArenaId,
    difficulty: 'easy' | 'normal' | 'hard'
  ) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  gameMode,
  onConfirm,
  onBack,
}) => {
  const [p1SelectedClass, setP1SelectedClass] = useState<CharacterClassId>('warrior');
  const [p2SelectedClass, setP2SelectedClass] = useState<CharacterClassId>('knight');
  const [activeTab, setActiveTab] = useState<'p1' | 'p2'>('p1');
  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>('courtyard');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const saveData = StorageManager.load();
  const currentClassDef = CHARACTER_CLASSES.find(
    (c) => c.id === (activeTab === 'p1' ? p1SelectedClass : p2SelectedClass)
  ) || CHARACTER_CLASSES[0];

  const p1Progress = saveData.characters[p1SelectedClass];
  const p2Progress = saveData.characters[p2SelectedClass];

  const getAbilityIcon = (id: string) => {
    switch (id) {
      case 'shield_bash': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'rage_strike': return <Axe className="w-5 h-5 text-red-400" />;
      case 'dash_attack': return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'power_shot': return <Target className="w-5 h-5 text-amber-400" />;
      case 'fireball': return <Flame className="w-5 h-5 text-purple-400" />;
      case 'whirlwind': return <RotateCw className="w-5 h-5 text-yellow-400" />;
      default: return <Zap className="w-5 h-5 text-yellow-400" />;
    }
  };

  const handleStartBattle = () => {
    soundEngine.playClick();
    const p1Def = CHARACTER_CLASSES.find((c) => c.id === p1SelectedClass) || CHARACTER_CLASSES[0];
    const p2Def = CHARACTER_CLASSES.find((c) => c.id === p2SelectedClass) || CHARACTER_CLASSES[1];
    onConfirm(p1Def, p2Def, selectedArenaId, difficulty);
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
          {gameMode === 'LOCAL_VS' ? 'ВЫБОР БОЙЦОВ 1 VS 1' : 'ВЫБОР ПЕРСОНАЖА'}
        </h1>

        <div className="w-24 text-right">
          <span className="text-xs text-stone-400 font-mono-numbers">
            {gameMode === 'LOCAL_VS' ? 'PVP' : gameMode === 'PRACTICE' ? 'ТРЕНИРОВКА' : 'КАМПАНИЯ'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fighter Cards Grid & Player Toggle */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Player 1 vs Player 2 Tabs if Local VS */}
          {gameMode === 'LOCAL_VS' && (
            <div className="flex items-center gap-2 p-1 bg-stone-900 border border-stone-800 rounded-lg">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('p1');
                }}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'p1'
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ВЫБОР ИГРОКА 1
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('p2');
                }}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'p2'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ВЫБОР ИГРОКА 2
              </button>
            </div>
          )}

          {/* 6 Classes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CHARACTER_CLASSES.map((cls) => {
              const isSelected = (activeTab === 'p1' ? p1SelectedClass : p2SelectedClass) === cls.id;
              const isP1 = p1SelectedClass === cls.id;
              const isP2 = p2SelectedClass === cls.id;

              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    soundEngine.playClick();
                    if (activeTab === 'p1') {
                      setP1SelectedClass(cls.id);
                    } else {
                      setP2SelectedClass(cls.id);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-36 ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  {/* Color Accent Pill */}
                  <div
                    className="w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: cls.visuals.primaryColor }}
                  />

                  <div>
                    <h3 className="font-medieval text-base font-bold text-stone-100">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">{cls.weaponName}</p>
                  </div>

                  {/* Badges for P1 & P2 */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {isP1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-600/30 text-amber-300 border border-amber-600/50 rounded">
                        P1
                      </span>
                    )}
                    {isP2 && gameMode === 'LOCAL_VS' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-600/30 text-red-300 border border-red-600/50 rounded">
                        P2
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Arena Selector (for VS & Practice) */}
          {(gameMode === 'LOCAL_VS' || gameMode === 'PRACTICE') && (
            <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl mt-2">
              <label className="block text-xs uppercase tracking-wider text-amber-500/90 font-bold mb-2">
                ВЫБОР АРЕНЫ:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ARENAS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedArenaId(a.id);
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      selectedArenaId === a.id
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Difficulty Selector (for Practice) */}
          {gameMode === 'PRACTICE' && (
            <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
              <label className="block text-xs uppercase tracking-wider text-amber-500/90 font-bold mb-2">
                СЛОЖНОСТЬ БОТА:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'normal', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      soundEngine.playClick();
                      setDifficulty(lvl);
                    }}
                    className={`py-2 px-3 text-xs font-bold uppercase rounded-lg border text-center transition-colors ${
                      difficulty === lvl
                        ? 'bg-amber-600 text-stone-950 border-amber-500'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {lvl === 'easy' ? 'Легкий' : lvl === 'normal' ? 'Средний' : 'Сложный'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Character Detailed Overview & Stats */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-500/80 font-bold">
                  {currentClassDef.title}
                </span>
                <h2 className="font-medieval text-3xl font-extrabold text-stone-100 mt-1">
                  {currentClassDef.name}
                </h2>
              </div>
              <div
                className="w-8 h-8 rounded-full border border-stone-700"
                style={{ backgroundColor: currentClassDef.visuals.primaryColor }}
              />
            </div>

            <p className="text-sm text-stone-300 mt-3 leading-relaxed">
              {currentClassDef.description}
            </p>

            {/* Unique Ability Box */}
            <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-xl my-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAbilityIcon(currentClassDef.ability.id)}
                  <span className="font-medieval font-bold text-stone-200 text-sm">
                    {currentClassDef.ability.name}
                  </span>
                </div>
                <span className="text-xs text-amber-400 font-mono-numbers">
                  Перезарядка: {currentClassDef.ability.cooldown}с
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                {currentClassDef.ability.description}
              </p>
            </div>

            {/* Stats Comparison */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-stone-400 font-bold">
                Характеристики класса:
              </p>

              {/* HP */}
              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span>Здоровье (HP)</span>
                  <span className="font-mono-numbers font-bold">{currentClassDef.baseStats.maxHp}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(currentClassDef.baseStats.maxHp / 280) * 100}%` }}
                  />
                </div>
              </div>

              {/* Attack */}
              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span>Урон атаки</span>
                  <span className="font-mono-numbers font-bold">{currentClassDef.baseStats.attack}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(currentClassDef.baseStats.attack / 50) * 100}%` }}
                  />
                </div>
              </div>

              {/* Defense */}
              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span>Защита</span>
                  <span className="font-mono-numbers font-bold">{currentClassDef.baseStats.defense}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(currentClassDef.baseStats.defense / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span>Скорость</span>
                  <span className="font-mono-numbers font-bold">{currentClassDef.baseStats.speed}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(currentClassDef.baseStats.speed / 280) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Start Battle Button */}
          <div className="mt-8 pt-4 border-t border-stone-800">
            <button
              onClick={handleStartBattle}
              className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-medieval font-black text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <Swords className="w-6 h-6 text-stone-950" />
              <span>В БОЙ НА АРЕНУ!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
