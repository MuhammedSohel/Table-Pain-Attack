/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, Trophy, Settings, Crosshair, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { GameState, PenId, HighScoreRecord, GameSettings } from './types';
import { PENS } from './data/pens';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { ArcadeHUD } from './components/ArcadeHUD';
import { FloatingDeskPreview } from './components/FloatingDeskPreview';
import { HowToPlayModal } from './components/Modals/HowToPlayModal';
import { LeaderboardModal } from './components/Modals/LeaderboardModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ArsenalModal } from './components/Modals/ArsenalModal';
import { GameOverModal } from './components/Modals/GameOverModal';
import { WaveClearModal } from './components/Modals/WaveClearModal';

const DEFAULT_SCORES: HighScoreRecord[] = [
  { score: 14850, wave: 8, penName: 'Classic Ballpoint', date: '2026-10-20' },
  { score: 11200, wave: 6, penName: 'Heavy Gel Pen', date: '2026-10-18' },
  { score: 8750, wave: 5, penName: 'Chunky Highlighter', date: '2026-10-14' },
  { score: 6400, wave: 4, penName: 'Classic Ballpoint', date: '2026-10-11' },
  { score: 4200, wave: 3, penName: 'Heavy Gel Pen', date: '2026-10-09' }
];

export default function App() {
  // Game lifecycle state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedPenId, setSelectedPenId] = useState<PenId>('ballpoint');
  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [combo, setCombo] = useState<number>(1);
  const [comboTimer, setComboTimer] = useState<NodeJS.Timeout | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number>(1);

  // Persistence
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tpa_best_score');
      return saved ? parseInt(saved, 10) : 14850;
    } catch {
      return 14850;
    }
  });

  const [totalWins, setTotalWins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tpa_total_wins');
      return saved ? parseInt(saved, 10) : 24;
    } catch {
      return 24;
    }
  });

  const [leaderboard, setLeaderboard] = useState<HighScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tpa_leaderboard');
      return saved ? JSON.parse(saved) : DEFAULT_SCORES;
    } catch {
      return DEFAULT_SCORES;
    }
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    return {
      soundEnabled: sound.isEnabled(),
      screenShake: true,
      showTrajectory: true,
      dragSensitivity: 1.0
    };
  });

  // Modals state
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArsenalOpen, setIsArsenalOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isWaveClearOpen, setIsWaveClearOpen] = useState(false);
  const [lastWaveBonus, setLastWaveBonus] = useState(500);

  // Sound sync
  const toggleSound = () => {
    const next = !settings.soundEnabled;
    sound.setEnabled(next);
    setSettings(prev => ({ ...prev, soundEnabled: next }));
  };

  // Start new game
  const handleStartGame = () => {
    sound.playClick();
    sound.playFlick(0.5);
    setScore(0);
    setWave(1);
    setCombo(1);
    setGameSessionId(prev => prev + 1);
    setIsGameOverOpen(false);
    setIsWaveClearOpen(false);
    setGameState('PLAYING');
  };

  // Scoring with combo streak system
  const handleScoreAdd = (points: number, isEdgeKnockout: boolean) => {
    const multiplier = isEdgeKnockout ? combo : 1;
    const finalPoints = points * multiplier;

    setScore(prev => {
      const newScore = prev + finalPoints;
      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          localStorage.setItem('tpa_best_score', String(newScore));
        } catch {
          // ignore
        }
      }
      return newScore;
    });

    if (isEdgeKnockout) {
      setCombo(prev => Math.min(prev + 1, 4));
      if (comboTimer) clearTimeout(comboTimer);
      const timer = setTimeout(() => {
        setCombo(1);
      }, 7000);
      setComboTimer(timer);
    }
  };

  // Wave victory
  const handleWaveComplete = () => {
    const bonus = 500 + wave * 300;
    setLastWaveBonus(bonus);
    setScore(prev => prev + bonus);
    setTotalWins(prev => {
      const updated = prev + 1;
      try {
        localStorage.setItem('tpa_total_wins', String(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setIsWaveClearOpen(true);
  };

  // Next wave trigger
  const handleNextWave = () => {
    setIsWaveClearOpen(false);
    setWave(prev => prev + 1);
  };

  // Game over triggered when player pen falls off
  const handleGameOver = () => {
    setIsGameOverOpen(true);

    // Save score if significant
    const newRecord: HighScoreRecord = {
      score,
      wave,
      penName: PENS[selectedPenId]?.name || 'Classic Ballpoint',
      date: new Date().toISOString().split('T')[0]
    };

    setLeaderboard(prev => {
      const updated = [...prev, newRecord].sort((a, b) => b.score - a.score).slice(0, 8);
      try {
        localStorage.setItem('tpa_leaderboard', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Restart match from game over or pause
  const handleRestart = () => {
    handleStartGame();
  };

  // Return to main menu
  const handleReturnToMenu = () => {
    setIsGameOverOpen(false);
    setIsWaveClearOpen(false);
    setGameState('MENU');
  };

  // Reset local stats
  const handleResetStats = () => {
    localStorage.removeItem('tpa_best_score');
    localStorage.removeItem('tpa_total_wins');
    localStorage.removeItem('tpa_leaderboard');
    setBestScore(0);
    setTotalWins(0);
    setLeaderboard([]);
  };

  const currentPen = PENS[selectedPenId] || PENS.ballpoint;

  return (
    <div className="min-h-screen bg-[#101522] text-[#F5E8CC] flex flex-col font-body selection:bg-[#FF7138] selection:text-white">
      {/* Background Retro Grid Texture */}
      <div className="fixed inset-0 pattern-graph-paper pointer-events-none opacity-40 z-0" />

      {/* Main Content Router */}
      {gameState === 'MENU' ? (
        /* ================= ASYMMETRIC MAIN MENU ================= */
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full px-6 py-6 md:py-10">
          {/* Top subtle status bar */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7138] shadow-sm" />
              <span className="text-xs font-arcade font-bold tracking-widest text-[#F5E8CC]/80 uppercase">
                VINTAGE STATIONERY ACTION
              </span>
            </div>

            {/* Top Center: Developed by Mohammed Sohel */}
            <div className="flex items-center justify-center">
              <a
                href="https://v0-musasohel.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-arcade tracking-wider text-slate-400 hover:text-[#FF7138] transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#182033]/80 border border-slate-700/60 shadow-sm"
              >
                <span>Developed by</span>
                <span className="font-bold text-[#F5E8CC] hover:text-[#FF7138] underline decoration-slate-600 underline-offset-2">
                  Mohammed Sohel
                </span>
              </a>
            </div>

            {/* Quick sound toggle */}
            <button
              onClick={toggleSound}
              className="text-xs font-arcade text-slate-400 hover:text-[#F5E8CC] flex items-center gap-1.5 transition-colors"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#3568F5]" />
                  <span>SOUND: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>SOUND: OFF</span>
                </>
              )}
            </button>
          </header>

          {/* Asymmetric Two-Column Hero Grid */}
          <div className="my-auto py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* LEFT COLUMN: Title, Brand, Hook, Badges, CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left space-y-4 sm:space-y-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-md bg-[#1A233A] border border-[#3568F5]/40 text-[#3568F5] text-[10px] sm:text-xs font-arcade font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>THE CLASSROOM ARCADE</span>
              </div>

              {/* Bold Oversized Hero Title */}
              <div>
                <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-[#F5E8CC] leading-[0.9]">
                  PEN <span className="text-[#FF7138]">ATTACK</span>
                </h1>
                <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-300 max-w-md font-body leading-relaxed">
                  The physics-driven schoolyard table flicking showdown. Slingshot your ballpoint, bounce rivals off the wooden desk edge, and reign supreme across escalating waves.
                </p>
              </div>

              {/* Arcade Badges: Best Score & Total Wins */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-[#182033] border border-slate-700/80 shadow-arcade">
                  <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#FF7138]" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-arcade tracking-widest text-slate-400 block uppercase font-semibold">
                      BEST SCORE
                    </span>
                    <span className="font-arcade text-xs sm:text-sm font-bold text-[#F5E8CC] tabular-nums">
                      {bestScore.toLocaleString()} PTS
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-[#182033] border border-slate-700/80 shadow-arcade">
                  <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-[#A6AD75]/20 text-[#A6AD75] flex items-center justify-center font-arcade text-[9px] sm:text-[10px] font-bold">
                    W
                  </div>
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-arcade tracking-widest text-slate-400 block uppercase font-semibold">
                      TOTAL WINS
                    </span>
                    <span className="font-arcade text-xs sm:text-sm font-bold text-[#A6AD75] tabular-nums">
                      {totalWins} WAVES
                    </span>
                  </div>
                </div>

                {/* Equipped pen indicator button */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsArsenalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-[#182033] hover:bg-[#202B45] border border-[#3568F5]/50 transition-colors shadow-arcade"
                  title="Switch equipped stationery"
                >
                  <Crosshair className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#3568F5]" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-arcade tracking-widest text-slate-400 block uppercase font-semibold">
                      EQUIPPED PEN
                    </span>
                    <span className="font-body text-xs font-semibold text-[#F5E8CC]">
                      {currentPen.name}
                    </span>
                  </div>
                </button>
              </div>

              {/* Action Buttons Group */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                {/* Prominent Electric Orange Start Game CTA */}
                <button
                  onClick={handleStartGame}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#FF7138] hover:bg-[#ff8352] active:translate-y-1 text-white font-display text-xl sm:text-2xl font-black uppercase tracking-wider rounded-xl shadow-arcade-orange flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <Play className="w-5 sm:w-6 h-5 sm:h-6 fill-white" />
                  <span>START GAME</span>
                </button>

                {/* Compact Secondary Controls in responsive 3-col grid on mobile */}
                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsHowToPlayOpen(true);
                    }}
                    className="px-2.5 sm:px-4 py-2.5 sm:py-3 bg-[#182033] hover:bg-[#202B45] border border-slate-700/80 active:translate-y-0.5 text-[10px] sm:text-xs font-arcade font-bold tracking-wider uppercase text-[#F5E8CC] rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>RULES</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsLeaderboardOpen(true);
                    }}
                    className="px-2.5 sm:px-4 py-2.5 sm:py-3 bg-[#182033] hover:bg-[#202B45] border border-slate-700/80 active:translate-y-0.5 text-[10px] sm:text-xs font-arcade font-bold tracking-wider uppercase text-[#F5E8CC] rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#FF7138]" />
                    <span>SCORES</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsSettingsOpen(true);
                    }}
                    aria-label="Settings"
                    className="py-2.5 sm:py-3 px-3 bg-[#182033] hover:bg-[#202B45] border border-slate-700/80 active:translate-y-0.5 text-[#F5E8CC] rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs font-arcade font-bold"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span className="sm:hidden">SET</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Illustrated Floating Desk & Pen Hero Visual */}
            <div className="lg:col-span-6 w-full flex justify-center">
              <FloatingDeskPreview selectedPen={currentPen} />
            </div>
          </div>

          {/* Footer Note */}
          <footer className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-body">
            <div>Table Pen Attack · The Nostalgic Schoolroom Arcade</div>
            <div className="flex items-center gap-4 mt-2 sm:mt-0 font-arcade text-[10px]">
              <span>60 FPS RIGID BODY PHYSICS</span>
              <span>·</span>
              <span>SYNTHESIZED 8-BIT AUDIO</span>
            </div>
          </footer>
        </main>
      ) : (
        /* ================= IN-GAME VIEWPORT ================= */
        <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Arcade In-Game HUD */}
          <ArcadeHUD
            score={score}
            wave={wave}
            bestScore={bestScore}
            combo={combo}
            isPaused={gameState === 'PAUSED'}
            soundEnabled={settings.soundEnabled}
            selectedPen={currentPen}
            onSelectPen={id => setSelectedPenId(id)}
            onTogglePause={() => {
              setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
            }}
            onToggleSound={toggleSound}
            onRestart={handleRestart}
            onOpenArsenal={() => setIsArsenalOpen(true)}
            onQuitToMenu={handleReturnToMenu}
          />

          {/* Active Canvas Play Area */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
            <GameCanvas
              key={`session_${gameSessionId}_wave_${wave}`}
              playerPenId={selectedPenId}
              wave={wave}
              onScoreAdd={handleScoreAdd}
              onWaveComplete={handleWaveComplete}
              onGameOver={handleGameOver}
              isPaused={gameState === 'PAUSED'}
              screenShakeEnabled={settings.screenShake}
              showTrajectory={settings.showTrajectory}
              onSelectPen={id => setSelectedPenId(id)}
            />
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        scores={leaderboard}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={newSets => setSettings(prev => ({ ...prev, ...newSets }))}
        onResetStats={handleResetStats}
      />

      <ArsenalModal
        isOpen={isArsenalOpen}
        onClose={() => setIsArsenalOpen(false)}
        selectedPenId={selectedPenId}
        onSelectPen={id => setSelectedPenId(id as PenId)}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        score={score}
        wave={wave}
        isNewBest={score >= bestScore && score > 0}
        onPlayAgain={handleRestart}
        onReturnToMenu={handleReturnToMenu}
      />

      <WaveClearModal
        isOpen={isWaveClearOpen}
        wave={wave}
        bonusPoints={lastWaveBonus}
        onNextWave={handleNextWave}
      />
    </div>
  );
}
