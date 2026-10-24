import React from 'react';
import { X, Check, Shield, Zap, Sparkles } from 'lucide-react';
import { PenDefinition } from '../../types';
import { PENS } from '../../data/pens';
import { sound } from '../../utils/audio';

interface ArsenalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPenId: string;
  onSelectPen: (id: string) => void;
}

export const ArsenalModal: React.FC<ArsenalModalProps> = ({
  isOpen,
  onClose,
  selectedPenId,
  onSelectPen
}) => {
  if (!isOpen) return null;

  const penList = Object.values(PENS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#101522]/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#182033] border-2 border-slate-700 rounded-2xl shadow-arcade p-4 sm:p-6 text-[#F5E8CC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div>
            <span className="text-[10px] font-arcade text-[#FF7138] uppercase tracking-widest font-bold">
              ARMORY SELECTOR
            </span>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#F5E8CC] tracking-wide">
              CHOOSE YOUR WEAPON
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

        {/* Pens Grid */}
        <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-3 font-body">
          {penList.map((pen: PenDefinition) => {
            const isSelected = selectedPenId === pen.id;
            return (
              <div
                key={pen.id}
                onClick={() => {
                  sound.playClick();
                  onSelectPen(pen.id);
                }}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1D2942] border-[#FF7138] shadow-arcade-orange'
                    : 'bg-[#101522]/80 border-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Active checkmark badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#FF7138] text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div>
                  {/* Pen visual swatch */}
                  <div className="w-full h-8 flex items-center justify-center mb-3">
                    <div
                      className="w-full h-3 rounded-full shadow-inner flex items-center justify-between px-1"
                      style={{ backgroundColor: pen.primaryColor }}
                    >
                      <div className="w-4 h-4 rounded-full -ml-1" style={{ backgroundColor: pen.accentColor }} />
                      <div className="w-3 h-3 rounded-full -mr-1" style={{ backgroundColor: pen.tipColor }} />
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold uppercase text-white leading-tight">
                    {pen.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {pen.description}
                  </p>
                </div>

                {/* Physics stat meters */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-[10px] font-arcade">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>MASS / POWER</span>
                      <span className="text-[#FF7138] font-bold">{Math.round(pen.mass * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-[#FF7138] rounded-full"
                        style={{ width: `${Math.min(pen.mass * 65, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>AGILITY / SPEED</span>
                      <span className="text-[#3568F5] font-bold">{Math.round(pen.agility * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-[#3568F5] rounded-full"
                        style={{ width: `${Math.min(pen.agility * 85, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 bg-[#FF7138] hover:bg-[#ff8352] text-white font-display text-lg font-bold tracking-wider uppercase rounded-xl shadow-arcade-orange active:translate-y-0.5 transition-all"
          >
            CONFIRM LOADOUT
          </button>
        </div>
      </div>
    </div>
  );
};
