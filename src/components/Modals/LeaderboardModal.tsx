import React from 'react';
import { X, Trophy, Medal } from 'lucide-react';
import { HighScoreRecord } from '../../types';
import { sound } from '../../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: HighScoreRecord[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, scores }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101522]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#182033] border-2 border-slate-700 rounded-2xl shadow-arcade p-6 text-[#F5E8CC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#FF7138]" />
            <div>
              <span className="text-[10px] font-arcade text-[#FF7138] uppercase tracking-widest font-bold">
                RECORDS
              </span>
              <h2 className="font-display text-2xl font-extrabold uppercase text-[#F5E8CC] tracking-wide">
                CLASSROOM LEADERBOARD
              </h2>
            </div>
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

        {/* Scores Table */}
        <div className="py-4 overflow-x-auto">
          <table className="w-full text-left font-body text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-arcade tracking-wider text-slate-400 uppercase">
                <th className="py-2.5 px-3">RANK</th>
                <th className="py-2.5 px-3">PEN TYPE</th>
                <th className="py-2.5 px-3">WAVE</th>
                <th className="py-2.5 px-3 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-arcade">
              {scores.map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-[#F5E8CC] flex items-center gap-1.5">
                    {idx === 0 ? (
                      <span className="text-[#FF7138] font-black">#1</span>
                    ) : idx === 1 ? (
                      <span className="text-[#3568F5] font-black">#2</span>
                    ) : idx === 2 ? (
                      <span className="text-[#A6AD75] font-black">#3</span>
                    ) : (
                      <span className="text-slate-500">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-body text-white font-medium">
                    {rec.penName}
                  </td>
                  <td className="py-3 px-3 text-slate-300 tabular-nums">
                    W-{String(rec.wave).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#FF7138] tabular-nums">
                    {rec.score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2 bg-[#202B45] hover:bg-[#283759] text-white font-display text-base font-bold tracking-wider uppercase rounded-xl transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
