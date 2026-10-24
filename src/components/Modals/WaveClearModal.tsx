import React from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface WaveClearModalProps {
  isOpen: boolean;
  wave: number;
  bonusPoints: number;
  onNextWave: () => void;
}

export const WaveClearModal: React.FC<WaveClearModalProps> = ({
  isOpen,
  wave,
  bonusPoints,
  onNextWave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101522]/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#182033] border-2 border-[#3568F5]/80 rounded-2xl shadow-arcade p-6 text-[#F5E8CC] text-center">
        {/* Eyebrow */}
        <span className="text-[11px] font-arcade text-[#3568F5] uppercase tracking-widest font-bold">
          TABLE SECURED
        </span>

        {/* Title */}
        <h2 className="font-display text-4xl font-black uppercase text-white tracking-wide mt-1">
          WAVE {wave} CLEARED!
        </h2>
        <p className="text-xs text-slate-400 font-body mt-1">
          All opponent stationery swept off the desk.
        </p>

        {/* Bonus reward */}
        <div className="my-5 p-3 rounded-xl bg-[#101522] border border-slate-700/80 font-arcade">
          <span className="text-[10px] text-slate-400 block tracking-wider">CLEAR BONUS</span>
          <span className="text-2xl font-extrabold text-[#A6AD75] tabular-nums">
            +{bonusPoints.toLocaleString()} PTS
          </span>
        </div>

        {/* Action */}
        <button
          onClick={() => {
            sound.playClick();
            onNextWave();
          }}
          className="w-full py-3 bg-[#3568F5] hover:bg-[#4678ff] text-white font-display text-lg font-bold tracking-wider uppercase rounded-xl shadow-arcade-cobalt active:translate-y-0.5 flex items-center justify-center gap-2 transition-all"
        >
          <span>NEXT WAVE</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
