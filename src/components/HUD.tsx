import React from 'react';
import { Fighter } from '../entities/Fighter';
import { GameMode } from '../types/game';
import { Shield, Zap, Target, Flame, RotateCw, Axe, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../systems/audio';

export interface HUDProps {
  p1: Fighter;
  p2: Fighter;
  gameMode: GameMode;
  matchResult: {
    isOver: boolean;
    winnerId: string | null;
    rewardXp?: number;
    rewardGold?: number;
    leveledUp?: boolean;
    newLevel?: number;
  };
  isPaused: boolean;
  onTogglePause: () => void;
  onRematch: () => void;
  onNextStage?: () => void;
  onGoToMenu: () => void;
  onGoToUpgrade?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  p1,
  p2,
  gameMode,
  matchResult,
  isPaused,
  onTogglePause,
  onRematch,
  onNextStage,
  onGoToMenu,
  onGoToUpgrade,
  soundEnabled,
  onToggleSound,
}) => {
  const p1HpRatio = Math.max(0, Math.min(1, p1.hp / p1.maxHp));
  const p2HpRatio = Math.max(0, Math.min(1, p2.hp / p2.maxHp));

  const p1AbilityCd = Math.max(0, p1.abilityCooldown);
  const p1DashCd = Math.max(0, p1.dashCooldown);

  const p2AbilityCd = Math.max(0, p2.abilityCooldown);
  const p2DashCd = Math.max(0, p2.dashCooldown);

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

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* Top Bar: Fighter HP and Statuses */}
      <div className="flex items-start justify-between w-full max-w-5xl mx-auto gap-8">
        {/* Player 1 HUD */}
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-medieval text-base md:text-lg font-bold text-amber-300">
              {p1.name}
            </span>
            <span className="text-xs text-stone-400 font-mono-numbers">
              {p1.classDef.name} · Ур. {p1.weaponLevel}
            </span>
          </div>

          {/* P1 HP Bar */}
          <div className="w-full h-5 md:h-6 bg-stone-900 border-2 border-stone-700 rounded-sm relative overflow-hidden shadow-md">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 transition-all duration-75"
              style={{ width: `${p1HpRatio * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-start pl-2 text-[11px] font-mono-numbers font-bold text-white drop-shadow">
              {Math.ceil(p1.hp)} / {p1.maxHp} HP
            </div>
          </div>
        </div>

        {/* Center: Pause & Sound Controls */}
        <div className="pointer-events-auto flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white rounded-md transition-colors shadow"
            title="Звук"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onTogglePause();
            }}
            className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white rounded-md transition-colors shadow"
            title="Пауза"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        {/* Player 2 / Bot HUD */}
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-stone-400 font-mono-numbers">
              {p2.classDef.name} · {gameMode === 'LOCAL_VS' ? 'Игрок 2' : 'Бот'}
            </span>
            <span className="font-medieval text-base md:text-lg font-bold text-red-400">
              {p2.name}
            </span>
          </div>

          {/* P2 HP Bar */}
          <div className="w-full h-5 md:h-6 bg-stone-900 border-2 border-stone-700 rounded-sm relative overflow-hidden shadow-md">
            <div
              className="h-full bg-gradient-to-l from-red-600 via-rose-500 to-amber-500 transition-all duration-75 ml-auto"
              style={{ width: `${p2HpRatio * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-mono-numbers font-bold text-white drop-shadow">
              {Math.ceil(p2.hp)} / {p2.maxHp} HP
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Abilities, Cooldowns & Controls Display */}
      <div className="w-full max-w-4xl mx-auto flex items-end justify-between">
        {/* P1 Action Slots */}
        <div className="flex items-center gap-3 bg-stone-950/85 backdrop-blur-sm border border-stone-800 p-2.5 rounded-lg shadow-xl">
          {/* Attack Slot */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-xs font-bold text-stone-200">АТАКА</span>
              <span className="text-[10px] text-amber-400 font-mono">[ F ]</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-1">Оружие</span>
          </div>

          {/* Ability Slot with Cooldown Sweep */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
              {getAbilityIcon(p1.classDef.ability.id)}
              <span className="text-[10px] text-amber-400 font-mono mt-0.5">[ G ]</span>

              {p1AbilityCd > 0 && (
                <div
                  className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono-numbers text-xs font-bold text-amber-400"
                >
                  {p1AbilityCd.toFixed(1)}
                </div>
              )}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 truncate max-w-[70px]">
              {p1.classDef.ability.name}
            </span>
          </div>

          {/* Dash Slot */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-xs font-bold text-stone-200">РЫВОК</span>
              <span className="text-[10px] text-amber-400 font-mono">[ Пробел ]</span>

              {p1DashCd > 0 && (
                <div
                  className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono-numbers text-xs font-bold text-amber-400"
                >
                  {p1DashCd.toFixed(1)}
                </div>
              )}
            </div>
            <span className="text-[10px] text-stone-400 mt-1">Уклонение</span>
          </div>
        </div>

        {/* Center Control Hint Banner */}
        <div className="hidden md:flex flex-col items-center text-xs text-stone-400 bg-stone-900/60 px-4 py-1.5 rounded-full border border-stone-800">
          <span>P1: WASD + F/G/Пробел {gameMode === 'LOCAL_VS' ? '· P2: Стрелки + K/L/J' : ''}</span>
        </div>

        {/* P2 Action Slots (if Local VS) */}
        {gameMode === 'LOCAL_VS' && (
          <div className="flex items-center gap-3 bg-stone-950/85 backdrop-blur-sm border border-stone-800 p-2.5 rounded-lg shadow-xl">
            {/* P2 Dash */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-xs font-bold text-stone-200">РЫВОК</span>
                <span className="text-[10px] text-red-400 font-mono">[ J / Num3 ]</span>
                {p2DashCd > 0 && (
                  <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono-numbers text-xs font-bold text-red-400">
                    {p2DashCd.toFixed(1)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-stone-400 mt-1">Уклонение</span>
            </div>

            {/* P2 Ability */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
                {getAbilityIcon(p2.classDef.ability.id)}
                <span className="text-[10px] text-red-400 font-mono mt-0.5">[ L / Num2 ]</span>
                {p2AbilityCd > 0 && (
                  <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono-numbers text-xs font-bold text-red-400">
                    {p2AbilityCd.toFixed(1)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 truncate max-w-[70px]">
                {p2.classDef.ability.name}
              </span>
            </div>

            {/* P2 Attack */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-stone-900 border border-stone-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-xs font-bold text-stone-200">АТАКА</span>
                <span className="text-[10px] text-red-400 font-mono">[ K / Num1 ]</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-1">Оружие</span>
            </div>
          </div>
        )}
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center pointer-events-auto z-40">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <h2 className="font-medieval text-3xl font-extrabold text-amber-400 mb-6">
              ПАУЗА
            </h2>

            <div className="space-y-4 mb-8 text-sm text-left bg-stone-950/70 p-4 rounded-lg border border-stone-800">
              <div>
                <p className="font-bold text-amber-300 mb-1">Управление Игрока 1:</p>
                <p className="text-stone-300">WASD — Передвижение</p>
                <p className="text-stone-300">F — Обычная атака</p>
                <p className="text-stone-300">G — Уникальная способность</p>
                <p className="text-stone-300">Пробел / H — Рывок уклонения</p>
              </div>

              {gameMode === 'LOCAL_VS' && (
                <div className="pt-2 border-t border-stone-800">
                  <p className="font-bold text-red-300 mb-1">Управление Игрока 2:</p>
                  <p className="text-stone-300">Стрелки — Передвижение</p>
                  <p className="text-stone-300">K или Numpad 1 — Обычная атака</p>
                  <p className="text-stone-300">L или Numpad 2 — Способность</p>
                  <p className="text-stone-300">J или Numpad 3 — Рывок</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onTogglePause();
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold text-stone-950 rounded-lg transition-colors shadow-lg"
              >
                ПРОДОЛЖИТЬ БОЙ
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onGoToMenu();
                }}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-lg transition-colors border border-stone-700"
              >
                ВЫЙТИ В МЕНЮ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Victory / Defeat Modal */}
      {matchResult.isOver && (
        <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center pointer-events-auto z-40 animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-600/80 rounded-xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
            {/* Header Ribbon */}
            <div className="mb-6">
              <h1 className={`font-medieval text-4xl md:text-5xl font-black tracking-wider ${
                matchResult.winnerId === p1.id ? 'text-amber-400 drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]' : 'text-red-500'
              }`}>
                {matchResult.winnerId === p1.id ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
              </h1>
              <p className="text-stone-300 mt-2 text-sm font-medium">
                {matchResult.winnerId === p1.id
                  ? `${p1.name} одержал славную победу на арене!`
                  : `${p2.name} оказался сильнее в этот раз.`}
              </p>
            </div>

            {/* Match Rewards Card */}
            {matchResult.winnerId === p1.id && matchResult.rewardXp && (
              <div className="bg-stone-950/80 border border-amber-900/60 rounded-lg p-4 mb-6">
                <p className="text-xs uppercase tracking-widest text-amber-500/80 font-bold mb-3">
                  Награда за триумф
                </p>
                <div className="flex items-center justify-around">
                  <div>
                    <span className="block font-medieval text-2xl font-bold text-amber-300">
                      +{matchResult.rewardXp}
                    </span>
                    <span className="text-xs text-stone-400">Опыта (XP)</span>
                  </div>
                  <div className="w-[1px] h-8 bg-stone-800" />
                  <div>
                    <span className="block font-medieval text-2xl font-bold text-yellow-400">
                      +{matchResult.rewardGold}
                    </span>
                    <span className="text-xs text-stone-400">Золота арены</span>
                  </div>
                </div>

                {matchResult.leveledUp && (
                  <div className="mt-4 pt-3 border-t border-amber-900/40 text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5 animate-bounce">
                    <Zap className="w-4 h-4" />
                    <span>НОВЫЙ УРОВЕНЬ: {matchResult.newLevel}! ПОЛУЧЕНЫ ОЧКИ ПРОКАЧКИ!</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {matchResult.winnerId === p1.id && onNextStage && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onNextStage();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-bold text-base rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  СЛЕДУЮЩАЯ АРЕНА
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onRematch();
                }}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-lg transition-colors border border-stone-700"
              >
                ЕЩЁ БОЙ
              </button>

              {onGoToUpgrade && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onGoToUpgrade();
                  }}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-medium rounded-lg transition-colors border border-stone-800"
                >
                  ПРОКАЧАТЬ ХАРАКТЕРИСТИКИ
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onGoToMenu();
                }}
                className="w-full py-2.5 bg-stone-950 hover:bg-stone-900 text-stone-400 hover:text-stone-200 font-medium rounded-lg transition-colors"
              >
                В ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
