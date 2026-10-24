import React from 'react';
import { X, Volume2, VolumeX, Sparkles, Navigation, RotateCcw } from 'lucide-react';
import { GameSettings } from '../../types';
import { sound } from '../../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetStats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetStats
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101522]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#182033] border-2 border-slate-700 rounded-2xl shadow-arcade p-6 text-[#F5E8CC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div>
            <span className="text-[10px] font-arcade text-[#FF7138] uppercase tracking-widest font-bold">
              PREFERENCES
            </span>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#F5E8CC] tracking-wide">
              SETTINGS
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

        {/* Settings Options */}
        <div className="py-4 space-y-4 font-body text-sm">
          {/* Sound Audio FX */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3568F5]/20 text-[#3568F5] flex items-center justify-center">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </div>
              <div>
                <div className="font-semibold text-white">Audio Synthesizer</div>
                <div className="text-xs text-slate-400">8-bit bleeps & desk tap effects</div>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                sound.setEnabled(next);
                onUpdateSettings({ soundEnabled: next });
                if (next) sound.playClick();
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-[#FF7138]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Screen Shake Impact */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF7138]/20 text-[#FF7138] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Impact Screen Shake</div>
                <div className="text-xs text-slate-400">Camera recoil on heavy collisions</div>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ screenShake: !settings.screenShake });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.screenShake ? 'bg-[#FF7138]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.screenShake ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Aim Prediction Line */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#101522]/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#A6AD75]/20 text-[#A6AD75] flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Trajectory Prediction Dots</div>
                <div className="text-xs text-slate-400">Show extended trajectory guidelines</div>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ showTrajectory: !settings.showTrajectory });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.showTrajectory ? 'bg-[#FF7138]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.showTrajectory ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reset Statistics */}
          <div className="pt-2">
            <button
              onClick={() => {
                sound.playClick();
                if (window.confirm('Reset all high scores and win records?')) {
                  onResetStats();
                }
              }}
              className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Records & Stats</span>
            </button>
          </div>
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
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
