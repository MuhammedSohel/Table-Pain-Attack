import React from 'react';
import { Trophy, Flame, Pause, Play, Volume2, VolumeX, RotateCcw, Crosshair } from 'lucide-react';
import { PenDefinition } from '../types';
import { sound } from '../utils/audio';

interface ArcadeHUDProps {
  score: number;
  wave: number;
  bestScore: number;
  combo: number;
  isPaused: boolean;
  soundEnabled: boolean;
  selectedPen: PenDefinition;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onOpenArsenal?: () => void;
  onQuitToMenu: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  score,
  wave,
  bestScore,
  combo,
  isPaused,
  soundEnabled,
  selectedPen,
  onTogglePause,
  onToggleSound,
  onRestart,
  onOpenArsenal,
  onQuitToMenu
}) => {
  return (
    <header className="w-full flex flex-col gap-1.5 sm:gap-2.5 py-1.5 sm:py-2.5 px-2 sm:px-4 md:px-8 select-none">
      {/* Top Center Developer Credit */}
      <div className="flex justify-center">
        <a
          href="https://v0-musasohel.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] sm:text-[11px] font-arcade tracking-wider text-slate-400 hover:text-[#FF7138] transition-colors flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#182033]/80 border border-slate-700/60 shadow-sm"
        >
          <span>Developed by</span>
          <span className="font-bold text-[#F5E8CC] hover:text-[#FF7138] underline decoration-slate-600 underline-offset-2">
            Mohammed Sohel
          </span>
        </a>
      </div>

      {/* Top Bar with Three Zones */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand & Wave Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onQuitToMenu();
            }}
            className="flex items-center gap-1 group text-left focus:outline-none"
            title="Return to Menu"
          >
            <span className="font-display text-lg sm:text-2xl md:text-3xl font-extrabold tracking-wider text-[#F5E8CC] group-hover:text-[#FF7138] transition-colors uppercase leading-none">
              PEN ATTACK
            </span>
          </button>

          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#1A233A] border border-[#3568F5]/50 rounded-md flex items-center gap-1 shadow-sm">
            <span className="text-[9px] sm:text-[10px] font-arcade text-[#3568F5] uppercase tracking-widest font-bold">
              WAVE
            </span>
            <span className="text-xs sm:text-sm font-arcade font-bold text-[#F5E8CC] tabular-nums">
              {String(wave).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Zone 2: Arcade Scores Counter */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          {/* Main Score Panel */}
          <div className="flex flex-col items-center bg-[#182033] px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-lg border border-slate-700/80 shadow-arcade">
            <span className="text-[8px] sm:text-[10px] font-arcade tracking-widest text-slate-400 font-semibold uppercase">
              SCORE
            </span>
            <span className="font-arcade text-base sm:text-xl md:text-2xl font-bold text-[#FF7138] tabular-nums leading-none">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combo Multiplier Alert (when > 1) */}
          {combo > 1 && (
            <div className="flex items-center gap-1 bg-[#FF7138]/20 border border-[#FF7138] text-[#FF7138] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md animate-pulse">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-xs font-arcade font-bold">{combo}X</span>
            </div>
          )}

          {/* Best Score Record */}
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1 text-[11px] font-arcade text-slate-400">
              <Trophy className="w-3 h-3 text-[#A6AD75]" />
              <span>BEST</span>
            </div>
            <span className="font-arcade text-sm font-bold text-[#A6AD75] tabular-nums">
              {Math.max(score, bestScore).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Zone 3: Compact Control Affordances */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#182033] hover:bg-[#202B45] active:translate-y-0.5 border border-slate-700/80 flex items-center justify-center text-[#F5E8CC] hover:text-[#FF7138] transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />}
          </button>

          {/* Quick Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            aria-label="Restart game"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#182033] hover:bg-[#202B45] active:translate-y-0.5 border border-slate-700/80 flex items-center justify-center text-[#F5E8CC] hover:text-[#3568F5] transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onTogglePause();
            }}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#FF7138] hover:bg-[#ff8554] active:translate-y-0.5 text-white flex items-center justify-center shadow-arcade-orange transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />}
          </button>
        </div>
      </div>

      {/* Secondary Bar: Active Pen Spec Strip */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-arcade text-slate-400">EQUIPPED:</span>
          <span className="font-semibold text-[#F5E8CC]">{selectedPen.name}</span>
          <span className="hidden md:inline text-slate-500">·</span>
          <span className="hidden md:inline text-slate-400">{selectedPen.tagline}</span>
        </div>

        {onOpenArsenal && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenArsenal();
            }}
            className="text-[11px] font-medium text-[#3568F5] hover:text-[#5B88FF] transition-colors flex items-center gap-1 underline underline-offset-4"
          >
            <Crosshair className="w-3 h-3" />
            <span>Switch Pen</span>
          </button>
        )}
      </div>
    </header>
  );
};
