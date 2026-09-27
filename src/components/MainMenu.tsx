import React from 'react';
import { Swords, Users, Target, Shield, Hammer, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../systems/audio';

export interface MainMenuProps {
  onStartCampaign: () => void;
  onStartVs: () => void;
  onStartPractice: () => void;
  onOpenCharacters: () => void;
  onOpenArmory: () => void;
  gold: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartCampaign,
  onStartVs,
  onStartPractice,
  onOpenCharacters,
  onOpenArmory,
  gold,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="relative w-full min-h-screen bg-stone-950 flex flex-col items-center justify-between p-6 overflow-y-auto">
      {/* Background Ambient Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Top Bar with Gold and Audio */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="font-medieval text-xl font-bold tracking-wider text-amber-400">
            IRON & GLORY
          </span>
          <span className="text-xs text-stone-400 hidden sm:inline">· 2D Medieval Arena</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Gold Display */}
          <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs text-amber-500 font-bold">ЗОЛОТО:</span>
            <span className="font-mono-numbers text-sm font-bold text-yellow-400">{gold}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white rounded-lg transition-colors"
            title="Переключить звук"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-stone-500" />}
          </button>
        </div>
      </header>

      {/* Hero Title Section */}
      <div className="w-full max-w-xl text-center my-auto py-8 z-10 flex flex-col items-center">
        {/* Emblem */}
        <div className="w-20 h-20 bg-gradient-to-b from-amber-600 to-stone-900 border-2 border-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-950/40 mb-4 transform hover:scale-105 transition-transform">
          <Swords className="w-10 h-10 text-amber-200" />
        </div>

        <h1 className="font-medieval text-5xl md:text-6xl font-black text-amber-400 tracking-wider drop-shadow-md">
          IRON & GLORY
        </h1>
        <p className="text-stone-400 text-sm md:text-base mt-2 font-medium max-w-md">
          Динамичные 2D сражения средневековых воинов. Прокачивай класс, куй оружие и побеждай чемпионов арены!
        </p>

        {/* Menu Buttons Group */}
        <div className="w-full flex flex-col gap-3.5 mt-8">
          {/* Campaign */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartCampaign();
            }}
            className="group relative w-full py-4 px-6 bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-medieval font-black text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-stone-950" />
              <span>КАМПАНИЯ</span>
            </div>
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-900/80">
              6 Арен · Боссы
            </span>
          </button>

          {/* Local VS */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartVs();
            }}
            className="w-full py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-700 hover:border-amber-500 font-medieval font-bold text-base rounded-xl shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span>1 VS 1 НА ОДНОМ ПК</span>
            </div>
            <span className="text-xs text-stone-400 font-sans">
              2 Игрока на клавиатуре
            </span>
          </button>

          {/* Practice */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartPractice();
            }}
            className="w-full py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-700 hover:border-amber-500 font-medieval font-bold text-base rounded-xl shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-emerald-400" />
              <span>ТРЕНИРОВКА</span>
            </div>
            <span className="text-xs text-stone-400 font-sans">
              Бой с ботом
            </span>
          </button>

          {/* Characters & Armory Row */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenCharacters();
              }}
              className="py-3 px-4 bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-600 font-medieval font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>ПЕРСОНАЖИ</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenArmory();
              }}
              className="py-3 px-4 bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-600 font-medieval font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>ОРУЖЕЙНАЯ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls Summary */}
      <footer className="w-full max-w-5xl z-10 py-3 border-t border-stone-900 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Управление: P1 (WASD + F/G/Пробел) · P2 (Стрелки + K/L/J)</span>
        <span>Версия 1.0 · Полная автономная игра без доната и рекламы</span>
      </footer>
    </div>
  );
};
