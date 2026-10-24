import React from 'react';
import { RotateCcw, Home, Trophy, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  wave: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  wave,
  isNewBest,
  onPlayAgain,
  onReturnToMenu
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101522]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#182033] border-2 border-red-500/70 rounded-2xl shadow-arcade p-6 text-[#F5E8CC] text-center">
        {/* Eyebrow */}
        <span className="text-[11px] font-arcade text-red-400 uppercase tracking-widest font-bold">
          OUT OF BOUNDS
        </span>

        {/* Main Title */}
        <h2 className="font-display text-4xl md:text-5xl font-black uppercase text-white tracking-wide mt-1">
          PEN KNOCKED OFF!
        </h2>
        <p className="text-xs text-slate-400 font-body mt-1">
          Your pen tumbled off the edge into the abyss.
        </p>

        {/* Score Card */}
        <div className="my-6 p-4 rounded-xl bg-[#101522] border border-slate-700/80 space-y-3 font-arcade">
          {isNewBest && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF7138]/20 border border-[#FF7138] rounded-full text-xs font-bold text-[#FF7138] animate-bounce">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW BEST RECORD!</span>
            </div>
          )}

          <div className="flex justify-around items-center pt-2">
            <div>
              <span className="text-[10px] tracking-wider text-slate-400 block">FINAL SCORE</span>
              <span className="text-3xl font-extrabold text-[#FF7138] tabular-nums">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="w-[1px] h-10 bg-slate-800" />

            <div>
              <span className="text-[10px] tracking-wider text-slate-400 block">WAVES CLEARED</span>
              <span className="text-3xl font-extrabold text-[#3568F5] tabular-nums">
                {wave}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 font-display text-lg tracking-wider uppercase">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full py-3 bg-[#FF7138] hover:bg-[#ff8352] text-white font-bold rounded-xl shadow-arcade-orange active:translate-y-0.5 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onReturnToMenu();
            }}
            className="w-full py-2.5 bg-[#101522] hover:bg-[#202B45] border border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl active:translate-y-0.5 flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
