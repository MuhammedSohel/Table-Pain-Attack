import React from 'react';
import { X, Target, ShieldAlert, Award, MoveRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101522]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#182033] border-2 border-slate-700 rounded-2xl shadow-arcade p-6 text-[#F5E8CC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div>
            <span className="text-[10px] font-arcade text-[#FF7138] uppercase tracking-widest font-bold">
              MANUAL & RULES
            </span>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#F5E8CC] tracking-wide">
              HOW TO PLAY
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#101522] hover:bg-[#202B45] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="py-5 space-y-4 font-body text-sm">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-[#3568F5]/20 border border-[#3568F5]/40 text-[#3568F5] flex items-center justify-center shrink-0 font-arcade font-bold">
              01
            </div>
            <div>
              <h4 className="font-semibold text-white">Slingshot Aim & Charge</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Click and drag backward from your pen on the desk. The farther you stretch, the greater the flick velocity and launch power.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-[#FF7138]/20 border border-[#FF7138]/40 text-[#FF7138] flex items-center justify-center shrink-0 font-arcade font-bold">
              02
            </div>
            <div>
              <h4 className="font-semibold text-white">Defend the Desk Perimeter</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Ram opposing pens across the dashed yellow/orange hazard line. Knocking rival pens into the void clears them instantly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-[#A6AD75]/20 border border-[#A6AD75]/40 text-[#A6AD75] flex items-center justify-center shrink-0 font-arcade font-bold">
              03
            </div>
            <div>
              <h4 className="font-semibold text-white">Choose Your Stationery Arsenal</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Switch between the agile Classic Ballpoint, the tungsten-weighted Heavy Gel Pen, and the broad Chunky Highlighter for strategic advantage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 bg-[#FF7138] hover:bg-[#ff8352] text-white font-display text-lg font-bold tracking-wider uppercase rounded-xl shadow-arcade-orange active:translate-y-0.5 transition-all"
          >
            READY TO FLICK
          </button>
        </div>
      </div>
    </div>
  );
};
