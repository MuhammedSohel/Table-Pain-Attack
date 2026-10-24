import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenEntity, Particle, Vector2D } from '../types';
import { PENS } from '../data/pens';
import {
  DeskBounds,
  checkPenCollision,
  resolvePenCollision,
  updatePenDeskStatus,
  getPenEndpoints
} from '../game/physics';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  playerPenId: string;
  wave: number;
  onScoreAdd: (points: number, isEdgeKnockout: boolean) => void;
  onWaveComplete: () => void;
  onGameOver: () => void;
  isPaused: boolean;
  screenShakeEnabled: boolean;
  showTrajectory: boolean;
  onTurnChange?: (turn: 'player' | 'opponent') => void;
  onSelectPen?: (id: any) => void;
}

// Arena dimensions
const DESK_WIDTH = 860;
const DESK_HEIGHT = 520;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 640;

const DESK_BOUNDS: DeskBounds = {
  x: (CANVAS_WIDTH - DESK_WIDTH) / 2,
  y: (CANVAS_HEIGHT - DESK_HEIGHT) / 2,
  width: DESK_WIDTH,
  height: DESK_HEIGHT,
  bevel: 12
};

// Pure generator for wave entities so canvas is synchronously populated from frame 0
function createWaveEntities(waveNum: number, pId: string): PenEntity[] {
  const playerDef = PENS[pId] || PENS.ballpoint;
  const entities: PenEntity[] = [];

  // Player Pen (placed at bottom-left quadrant)
  entities.push({
    id: 'player',
    type: playerDef.id,
    isPlayer: true,
    x: DESK_BOUNDS.x + DESK_BOUNDS.width * 0.28,
    y: DESK_BOUNDS.y + DESK_BOUNDS.height * 0.68,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 4,
    vAngle: 0,
    length: playerDef.length,
    radius: playerDef.radius,
    mass: playerDef.mass,
    friction: playerDef.friction,
    restitution: playerDef.restitution,
    primaryColor: playerDef.primaryColor,
    accentColor: playerDef.accentColor,
    tipColor: playerDef.tipColor,
    inkColor: playerDef.inkColor,
    clipColor: playerDef.clipColor,
    isAlive: true,
    fallProgress: 0,
    fallRotation: 0,
    inkTrail: []
  });

  // Enemy count scales with wave: 1 on wave 1, 2 on wave 2, 3 on wave 3+
  const enemyCount = Math.min(1 + Math.floor((waveNum - 1) * 0.8), 3);
  const enemyTypes: ('ballpoint' | 'gel' | 'highlighter')[] = ['ballpoint', 'gel', 'highlighter'];

  for (let i = 0; i < enemyCount; i++) {
    const eType = enemyTypes[(waveNum + i) % enemyTypes.length];
    const eDef = PENS[eType];
    const posX = DESK_BOUNDS.x + DESK_BOUNDS.width * (0.55 + (i * 0.18));
    const posY = DESK_BOUNDS.y + DESK_BOUNDS.height * (0.28 + ((i % 2) * 0.25));

    entities.push({
      id: `enemy_${i}`,
      type: eDef.id,
      isPlayer: false,
      x: Math.min(posX, DESK_BOUNDS.x + DESK_BOUNDS.width - 80),
      y: Math.min(posY, DESK_BOUNDS.y + DESK_BOUNDS.height - 80),
      vx: 0,
      vy: 0,
      angle: Math.PI * 0.75 + (Math.random() - 0.5) * 0.6,
      vAngle: 0,
      length: eDef.length,
      radius: eDef.radius,
      mass: eDef.mass,
      friction: eDef.friction,
      restitution: eDef.restitution,
      primaryColor: i === 0 ? '#E11D48' : i === 1 ? '#0284C7' : '#16A34A',
      accentColor: '#101522',
      tipColor: '#CBD5E1',
      inkColor: i === 0 ? '#E11D48' : i === 1 ? '#0284C7' : '#16A34A',
      clipColor: '#E2E8F0',
      isAlive: true,
      fallProgress: 0,
      fallRotation: 0,
      inkTrail: []
    });
  }

  return entities;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerPenId,
  wave,
  onScoreAdd,
  onWaveComplete,
  onGameOver,
  isPaused,
  screenShakeEnabled,
  showTrajectory,
  onTurnChange,
  onSelectPen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stable callback refs to avoid recreating the physics loop
  const onScoreAddRef = useRef(onScoreAdd);
  onScoreAddRef.current = onScoreAdd;
  const onWaveCompleteRef = useRef(onWaveComplete);
  onWaveCompleteRef.current = onWaveComplete;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const onTurnChangeRef = useRef(onTurnChange);
  onTurnChangeRef.current = onTurnChange;

  // Game internal state - initialized synchronously from frame 0
  const pensRef = useRef<PenEntity[]>(createWaveEntities(wave, playerPenId));
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleId = useRef(1);

  // Turn State Machine: 'PLAYER_TURN' -> 'PLAYER_MOVING' -> 'AI_WAITING' -> 'AI_MOVING' -> 'PLAYER_TURN'
  const turnStateRef = useRef<'PLAYER_TURN' | 'PLAYER_MOVING' | 'AI_WAITING' | 'AI_MOVING'>('PLAYER_TURN');
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragCurrentRef = useRef<Vector2D>({ x: 0, y: 0 });

  // Timers and single-trigger guards
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveEndedRef = useRef(false);
  const gameOverTriggeredRef = useRef(false);

  // Mobile Thumb Controls state
  const [mobileAngle, setMobileAngle] = useState<-22 | 0 | 22>(0);
  const [mobilePower, setMobilePower] = useState<number>(80);

  // Shake offset
  const shakeRef = useRef<{ x: number; y: number; trauma: number }>({ x: 0, y: 0, trauma: 0 });

  // Helper: Trigger screen shake
  const addShake = useCallback((amount: number) => {
    if (!screenShakeEnabled) return;
    shakeRef.current.trauma = Math.min(shakeRef.current.trauma + amount, 1.0);
  }, [screenShakeEnabled]);

  // Spawn collision particles
  const spawnHitParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 15 + Math.random() * 15,
        type: Math.random() > 0.4 ? 'spark' : 'ink'
      });
    }
  };

  const playerPenIdRef = useRef(playerPenId);
  playerPenIdRef.current = playerPenId;

  // In-place live pen update when player switches pen (0ms instant switch, keeps table state intact)
  useEffect(() => {
    const playerPen = pensRef.current.find(p => p.isPlayer && p.isAlive);
    const newDef = PENS[playerPenId] || PENS.ballpoint;
    if (playerPen && newDef) {
      playerPen.type = newDef.id;
      playerPen.length = newDef.length;
      playerPen.radius = newDef.radius;
      playerPen.mass = newDef.mass;
      playerPen.friction = newDef.friction;
      playerPen.restitution = newDef.restitution;
      playerPen.primaryColor = newDef.primaryColor;
      playerPen.accentColor = newDef.accentColor;
      playerPen.tipColor = newDef.tipColor;
      playerPen.inkColor = newDef.inkColor;
      playerPen.clipColor = newDef.clipColor;
      // Instant visual burst of ink particles
      spawnHitParticles(playerPen.x, playerPen.y, newDef.primaryColor, 10);
    }
  }, [playerPenId]);

  // Setup wave entities
  const setupWave = useCallback(() => {
    pensRef.current = createWaveEntities(wave, playerPenIdRef.current);
    particlesRef.current = [];
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
    waveEndedRef.current = false;
    gameOverTriggeredRef.current = false;
    isDraggingRef.current = false;
    turnStateRef.current = 'PLAYER_TURN';
    setTurn('player');
    onTurnChangeRef.current?.('player');
  }, [wave]);

  // Re-initialize on wave change
  useEffect(() => {
    setupWave();
  }, [setupWave]);

  // AI Opponent move execution
  const fireAIMove = useCallback(() => {
    const pens = pensRef.current;
    const player = pens.find(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
    const enemies = pens.filter(p => !p.isPlayer && p.isAlive && p.fallProgress === 0);

    if (!player || enemies.length === 0) {
      turnStateRef.current = 'PLAYER_TURN';
      setTurn('player');
      onTurnChangeRef.current?.('player');
      return;
    }

    // Pick active enemy (first ready enemy)
    const shooter = enemies[Math.floor(Math.random() * enemies.length)];

    // Target the player pen, calculating vector from shooter to player
    const dx = player.x - shooter.x;
    const dy = player.y - shooter.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Accuracy variation: slightly looser on early waves, sharp on later waves
    const inaccuracy = Math.max(0.18 - wave * 0.025, 0.04);
    const noiseAngle = (Math.random() - 0.5) * inaccuracy;
    const cos = Math.cos(noiseAngle);
    const sin = Math.sin(noiseAngle);
    const aimX = (dx / dist) * cos - (dy / dist) * sin;
    const aimY = (dx / dist) * sin + (dy / dist) * cos;

    // Power scales with distance, capped between 8.5 and 15.0
    const basePower = Math.min(Math.max(dist * 0.025, 8.5), 15.0);

    shooter.vx = aimX * basePower;
    shooter.vy = aimY * basePower;
    shooter.vAngle = (Math.random() - 0.5) * 0.3;

    sound.playFlick(basePower / 15);
    addShake(0.18);

    turnStateRef.current = 'AI_MOVING';
  }, [wave, addShake]);

  // Main 60 FPS animation & physics loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp delta time
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!isPaused) {
        // 1. SCREEN SHAKE DECAY
        if (shakeRef.current.trauma > 0) {
          const t = shakeRef.current.trauma;
          const shakeFactor = t * t * 12; // quadratic falloff
          shakeRef.current.x = (Math.random() * 2 - 1) * shakeFactor;
          shakeRef.current.y = (Math.random() * 2 - 1) * shakeFactor;
          shakeRef.current.trauma = Math.max(0, shakeRef.current.trauma - dt * 2.5);
        } else {
          shakeRef.current.x = 0;
          shakeRef.current.y = 0;
        }

        // 2. PHYSICS UPDATE
        const pens = pensRef.current;
        let anyMoving = false;

        // Integration
        for (const pen of pens) {
          if (!pen.isAlive) continue;

          // Check if falling off table
          const { fellOffJustNow } = updatePenDeskStatus(pen, DESK_BOUNDS, dt);
          if (fellOffJustNow) {
            sound.playFallOffEdge();
            addShake(0.35);
            if (pen.isPlayer) {
              // Player fell off
              if (!gameOverTriggeredRef.current) {
                gameOverTriggeredRef.current = true;
                if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
                gameOverTimerRef.current = setTimeout(() => {
                  onGameOverRef.current?.();
                }, 600);
              }
            } else {
              // Enemy fell off: combo score!
              onScoreAddRef.current?.(350 * wave, true);
              sound.playScoreChime(2);
            }
          }

          if (pen.fallProgress === 0) {
            // Normal table sliding
            pen.x += pen.vx * dt * 60;
            pen.y += pen.vy * dt * 60;
            pen.angle += pen.vAngle * dt * 60;

            // Apply friction
            pen.vx *= pen.friction;
            pen.vy *= pen.friction;
            pen.vAngle *= 0.94; // angular damping

            // Velocity cutoff
            const speed = Math.hypot(pen.vx, pen.vy);
            if (speed < 0.04) {
              pen.vx = 0;
              pen.vy = 0;
            } else {
              anyMoving = true;
              // Add ink trail
              if (Math.random() > 0.4) {
                pen.inkTrail.push({ x: pen.x, y: pen.y, alpha: 0.6 });
                if (pen.inkTrail.length > 20) pen.inkTrail.shift();
              }
            }

            if (Math.abs(pen.vAngle) < 0.002) {
              pen.vAngle = 0;
            } else {
              anyMoving = true;
            }
          } else {
            anyMoving = true;
          }

          // Fade ink trail
          for (let i = 0; i < pen.inkTrail.length; i++) {
            pen.inkTrail[i].alpha -= dt * 0.45;
          }
          pen.inkTrail = pen.inkTrail.filter(pt => pt.alpha > 0.05);
        }

        // Pen-to-Pen Collisions
        for (let i = 0; i < pens.length; i++) {
          for (let j = i + 1; j < pens.length; j++) {
            const penA = pens[i];
            const penB = pens[j];

            const col = checkPenCollision(penA, penB);
            if (col && col.hit) {
              const impulse = resolvePenCollision(penA, penB, col);
              if (impulse > 0.2) {
                sound.playCollision(impulse / 10);
                addShake(Math.min(impulse * 0.05, 0.4));
                spawnHitParticles(col.ptA.x, col.ptA.y, penA.inkColor, 8);
                spawnHitParticles(col.ptB.x, col.ptB.y, '#FF7138', 5);

                // Small score for direct player hit
                if (penA.isPlayer || penB.isPlayer) {
                  onScoreAddRef.current?.(50, false);
                }
              }
            }
          }
        }

        // Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.life += 1;
          if (p.life >= p.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        // TURN & WAVE STATE CHECK
        const playerAlive = pens.some(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
        const aliveEnemies = pens.filter(p => !p.isPlayer && p.isAlive && p.fallProgress === 0);

        if (!anyMoving) {
          if (!playerAlive || gameOverTriggeredRef.current) {
            // Player lost or falling off: wait for game over modal without triggering wave victory
          } else if (aliveEnemies.length === 0) {
            // Wave cleared! Trigger exactly once per wave
            if (!waveEndedRef.current) {
              waveEndedRef.current = true;
              sound.playWaveVictory();
              onWaveCompleteRef.current?.();
            }
          } else if (turnStateRef.current === 'PLAYER_MOVING') {
            // Player's shot has stopped moving! Hand turn over to Opponent:
            turnStateRef.current = 'AI_WAITING';
            setTurn('opponent');
            onTurnChangeRef.current?.('opponent');

            if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
            aiTimerRef.current = setTimeout(() => {
              fireAIMove();
            }, 600);
          } else if (turnStateRef.current === 'AI_MOVING') {
            // AI's shot has stopped moving! Hand turn back to Player:
            turnStateRef.current = 'PLAYER_TURN';
            setTurn('player');
            onTurnChangeRef.current?.('player');
          }
        }
      }

      // 3. CANVAS RENDERING
      ctx.save();
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Apply screen shake
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // A. Deep Void / Table Floor Shadow
      ctx.fillStyle = '#101522';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // B. Floating Wooden Desk Top
      renderDesk(ctx, DESK_BOUNDS);

      // C. Ink Trails on desk surface
      for (const pen of pensRef.current) {
        if (pen.inkTrail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pen.inkTrail[0].x, pen.inkTrail[0].y);
          for (let i = 1; i < pen.inkTrail.length; i++) {
            ctx.lineTo(pen.inkTrail[i].x, pen.inkTrail[i].y);
          }
          ctx.strokeStyle = pen.inkColor;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.35;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }

      // D. Pens (Sort so falling pens drop underneath or scale down)
      const sortedPens = [...pensRef.current].sort((a, b) => b.fallProgress - a.fallProgress);
      for (const pen of sortedPens) {
        if (!pen.isAlive) continue;
        renderPen(ctx, pen);
      }

      // E. Aiming Slingshot & Trajectory UI (only when player turn and dragging)
      if (turn === 'player' && isDraggingRef.current) {
        const playerPen = pensRef.current.find(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
        if (playerPen) {
          renderAimTrajectory(ctx, playerPen, dragStartRef.current, dragCurrentRef.current, showTrajectory);
        }
      }

      // F. Hit Particles
      for (const p of particlesRef.current) {
        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [
    isPaused,
    wave,
    showTrajectory,
    addShake,
    fireAIMove
  ]);

  // Handle player flick trigger on drag release
  const handleFlickRelease = useCallback(() => {
    if (turnStateRef.current !== 'PLAYER_TURN' || !isDraggingRef.current) return;
    isDraggingRef.current = false;

    const player = pensRef.current.find(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
    if (!player) return;

    const dx = dragStartRef.current.x - dragCurrentRef.current.x;
    const dy = dragStartRef.current.y - dragCurrentRef.current.y;
    const dragDist = Math.hypot(dx, dy);

    if (dragDist < 10) {
      // Too small, ignore
      return;
    }

    const maxDrag = 140;
    const clampedDist = Math.min(dragDist, maxDrag);
    const powerRatio = clampedDist / maxDrag;

    // Launch speed
    const launchSpeed = powerRatio * 18 * (PENS[player.type]?.agility || 1.0);

    const normX = dx / dragDist;
    const normY = dy / dragDist;

    // Apply impulse to player pen
    player.vx = normX * launchSpeed;
    player.vy = normY * launchSpeed;

    // Angular torque: calculate based on offset from pen axis
    const seg = getPenEndpoints(player);
    const penDirX = (seg.tip.x - seg.cap.x) / player.length;
    const penDirY = (seg.tip.y - seg.cap.y) / player.length;
    const crossSpin = normX * penDirY - normY * penDirX;
    player.vAngle = crossSpin * 0.28;

    sound.playFlick(powerRatio);
    addShake(0.12 * powerRatio);

    // Mobile vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.([20]);
      } catch {
        // ignore
      }
    }

    // Set state to PLAYER_MOVING (opponent will attack once movement settles)
    turnStateRef.current = 'PLAYER_MOVING';
    setTurn('opponent');
    onTurnChange?.('opponent');
  }, [onTurnChange, addShake]);

  // Mobile Tactical Launch Flick
  const launchTacticalFlick = useCallback(() => {
    if (turnStateRef.current !== 'PLAYER_TURN' || isPaused) return;
    const player = pensRef.current.find(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
    if (!player) return;

    const powerRatio = mobilePower / 100;
    // Standard table angle points towards top-right towards rivals
    const baseAngle = -Math.PI / 4 + (mobileAngle * Math.PI) / 180;
    const dirX = Math.cos(baseAngle);
    const dirY = Math.sin(baseAngle);

    const speed = powerRatio * 18 * (PENS[player.type]?.agility || 1.0);
    player.vx = dirX * speed;
    player.vy = dirY * speed;
    player.vAngle = (mobileAngle / 22) * 0.28;

    sound.playFlick(powerRatio);
    addShake(0.12 * powerRatio);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.([25]);
      } catch {
        // ignore
      }
    }

    // Set state to PLAYER_MOVING (opponent will attack once movement settles)
    turnStateRef.current = 'PLAYER_MOVING';
    setTurn('opponent');
    onTurnChange?.('opponent');
  }, [isPaused, mobilePower, mobileAngle, onTurnChange, addShake]);

  // Global window pointer up listener so dragging outside canvas never gets stuck on mobile
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        handleFlickRelease();
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [handleFlickRelease]);

  // Pointer event handlers (touch and mouse unified)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (turnStateRef.current !== 'PLAYER_TURN' || isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const player = pensRef.current.find(p => p.isPlayer && p.isAlive && p.fallProgress === 0);
    if (!player) return;

    const isTouch = e.pointerType === 'touch';
    const distToPlayer = Math.hypot(clientX - player.x, clientY - player.y);
    // On mobile touch screens, use generous touch target radius (160px) or clicking anywhere in the lower-left desk zone
    const touchRadius = isTouch ? 180 : player.length * 0.9;
    const isTouchInPlayerZone = isTouch && (
      distToPlayer < touchRadius ||
      (clientY > DESK_BOUNDS.y + DESK_BOUNDS.height * 0.35 && clientX < DESK_BOUNDS.x + DESK_BOUNDS.width * 0.65)
    );

    if (distToPlayer < touchRadius || isTouchInPlayerZone) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: player.x, y: player.y };
      // If user tapped slightly away on mobile, gently start drag from that point
      dragCurrentRef.current = { x: clientX, y: clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    dragCurrentRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleFlickRelease();
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Render stylized floating wooden desk
  const renderDesk = (ctx: CanvasRenderingContext2D, bounds: DeskBounds) => {
    const { x, y, width, height, bevel } = bounds;

    // 1. Cast shadow of the floating desk
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = '#22150E';
    ctx.fillRect(x, y + 10, width, height);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 2. Beveled bottom wooden rim (dark walnut edge)
    ctx.fillStyle = '#2D1B11';
    ctx.fillRect(x, y + height - bevel, width, bevel + 12);

    // 3. Main desktop wood surface (warm golden oak / school desk tone)
    const woodGrad = ctx.createLinearGradient(x, y, x, y + height);
    woodGrad.addColorStop(0, '#5C3E28');
    woodGrad.addColorStop(0.5, '#523622');
    woodGrad.addColorStop(1, '#442B1A');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(x, y, width, height - bevel);

    // 4. Subtle wood grain plank lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const plankY = y + (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, plankY);
      ctx.lineTo(x + width, plankY);
      ctx.stroke();
    }

    // 5. Classroom desk pencil groove (routed horizontal trough near top)
    const grooveX = x + 60;
    const grooveY = y + 26;
    const grooveW = width - 120;
    const grooveH = 14;

    ctx.fillStyle = '#24160E';
    ctx.beginPath();
    ctx.roundRect(grooveX, grooveY, grooveW, grooveH, 7);
    ctx.fill();

    // Groove inner highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Engraved wooden metric ruler marks on right edge
    const rulerX = x + width - 36;
    const rulerY = y + 60;
    const rulerH = height - 120;
    ctx.strokeStyle = 'rgba(245, 232, 204, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerX, rulerY);
    ctx.lineTo(rulerX, rulerY + rulerH);
    ctx.stroke();

    for (let mark = 0; mark <= rulerH; mark += 18) {
      const isMajor = mark % 36 === 0;
      ctx.beginPath();
      ctx.moveTo(rulerX, rulerY + mark);
      ctx.lineTo(rulerX + (isMajor ? 12 : 6), rulerY + mark);
      ctx.stroke();
    }

    // 7. Corner notebook paper scrap with nostalgic doodle
    const scrapX = x + 35;
    const scrapY = y + height - 110;
    ctx.save();
    ctx.translate(scrapX, scrapY);
    ctx.rotate(-0.06);

    // Paper scrap body
    ctx.fillStyle = '#F5E8CC';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fillRect(0, 0, 85, 70);
    ctx.shadowBlur = 0;

    // Ruled lines on paper scrap
    ctx.strokeStyle = 'rgba(53, 104, 245, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 20); ctx.lineTo(85, 20);
    ctx.moveTo(0, 38); ctx.lineTo(85, 38);
    ctx.moveTo(0, 56); ctx.lineTo(85, 56);
    ctx.stroke();

    // Margin line
    ctx.strokeStyle = 'rgba(255, 113, 56, 0.3)';
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(18, 70);
    ctx.stroke();

    // Hand-drawn arcade doodle on paper
    ctx.strokeStyle = '#101522';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    // 5-point star doodle
    ctx.moveTo(48, 25);
    ctx.lineTo(54, 42);
    ctx.lineTo(39, 31);
    ctx.lineTo(57, 31);
    ctx.lineTo(42, 42);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // 8. Warning edge danger hash marks along the bevel border
    ctx.strokeStyle = '#FF7138';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 12]);
    ctx.strokeRect(x + 4, y + 4, width - 8, height - bevel - 8);
    ctx.setLineDash([]);
  };

  // Render individual 2D pen entity
  const renderPen = (ctx: CanvasRenderingContext2D, pen: PenEntity) => {
    ctx.save();

    // Scale and fade if falling off table
    if (pen.fallProgress > 0) {
      const scale = Math.max(1 - pen.fallProgress * 0.6, 0.2);
      ctx.translate(pen.x, pen.y);
      ctx.rotate(pen.angle + pen.fallRotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(1 - pen.fallProgress * 0.9, 0);
    } else {
      ctx.translate(pen.x, pen.y);
      ctx.rotate(pen.angle);
    }

    const halfLen = pen.length / 2;
    const r = pen.radius;

    // 1. Pen Drop Shadow (soft contact shadow)
    if (pen.fallProgress === 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(-halfLen + 2, -r + 2, pen.length - 4, r * 2 - 4, r);
      ctx.fill();
      ctx.restore();
    }

    // 2. Main Pen Barrel
    const barrelGrad = ctx.createLinearGradient(0, -r, 0, r);
    barrelGrad.addColorStop(0, '#FFFFFF');
    barrelGrad.addColorStop(0.2, pen.primaryColor);
    barrelGrad.addColorStop(0.8, pen.primaryColor);
    barrelGrad.addColorStop(1, '#000000');

    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-halfLen + 15, -r, pen.length - 35, r * 2, 3);
    ctx.fill();

    // 3. Pen Grip / Accent Band
    ctx.fillStyle = pen.accentColor;
    ctx.beginPath();
    ctx.roundRect(halfLen - 42, -r - 0.5, 20, r * 2 + 1, 2);
    ctx.fill();

    // Grip texture grooves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 3; g++) {
      ctx.beginPath();
      ctx.moveTo(halfLen - 40 + g * 6, -r);
      ctx.lineTo(halfLen - 40 + g * 6, r);
      ctx.stroke();
    }

    // 4. Pen Tip (Cone toward positive X)
    ctx.fillStyle = pen.tipColor;
    ctx.beginPath();
    ctx.moveTo(halfLen - 20, -r);
    ctx.lineTo(halfLen, -2);
    ctx.lineTo(halfLen, 2);
    ctx.lineTo(halfLen - 20, r);
    ctx.closePath();
    ctx.fill();

    // Tiny ink ballpoint point
    ctx.fillStyle = pen.inkColor;
    ctx.beginPath();
    ctx.arc(halfLen + 1.5, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Pen Rear Cap / Plug
    ctx.fillStyle = pen.accentColor;
    ctx.beginPath();
    ctx.roundRect(-halfLen, -r, 16, r * 2, [r, 2, 2, r]);
    ctx.fill();

    // 6. Pen Pocket Clip
    ctx.fillStyle = pen.clipColor;
    ctx.fillRect(-halfLen + 8, -r - 4, 32, 3.5);
    ctx.beginPath();
    ctx.arc(-halfLen + 40, -r - 2.2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Subtle 3D cylindrical specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-halfLen + 15, -r * 0.4, pen.length - 38, r * 0.35);

    // 8. Player Indicator Aura & Mobile Touch Beacon
    if (pen.isPlayer && pen.fallProgress === 0) {
      const pulseTime = Date.now() / 320;
      const pulseExpand = Math.sin(pulseTime) * 3.5;

      ctx.strokeStyle = '#FF7138';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 0, halfLen + 15 + pulseExpand, r + 15 + pulseExpand, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Friendly directional guidance text when waiting for player move
      if (turn === 'player' && !isDraggingRef.current) {
        ctx.fillStyle = '#FF7138';
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◄ PULL TO FLICK ►', 0, -r - 20);
      }
    }

    ctx.restore();
  };

  // Render slingshot aim trajectory
  const renderAimTrajectory = (
    ctx: CanvasRenderingContext2D,
    player: PenEntity,
    start: Vector2D,
    current: Vector2D,
    showPredict: boolean
  ) => {
    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const dragDist = Math.hypot(dx, dy);

    if (dragDist < 6) return;

    const maxDrag = 140;
    const clampedDist = Math.min(dragDist, maxDrag);
    const powerRatio = clampedDist / maxDrag;

    const normX = dx / dragDist;
    const normY = dy / dragDist;

    // 1. Slingshot Elastic Pull Line (from drag point to player pen)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 113, 56, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Drag handle circle
    ctx.fillStyle = '#FF7138';
    ctx.beginPath();
    ctx.arc(current.x, current.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F5E8CC';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Trajectory Arrow pointing forward in launch direction
    const arrowLength = 50 + powerRatio * 150;
    const arrowEndX = player.x + normX * arrowLength;
    const arrowEndY = player.y + normY * arrowLength;

    // Arrow stem with power gradient
    const arrowGrad = ctx.createLinearGradient(player.x, player.y, arrowEndX, arrowEndY);
    arrowGrad.addColorStop(0, '#3568F5');
    arrowGrad.addColorStop(0.6, '#FF7138');
    arrowGrad.addColorStop(1, '#FF4500');

    ctx.strokeStyle = arrowGrad;
    ctx.lineWidth = 4 + powerRatio * 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();

    // Arrowhead
    const headAngle = Math.atan2(normY, normX);
    const headSize = 14 + powerRatio * 6;
    ctx.fillStyle = '#FF7138';
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(
      arrowEndX - headSize * Math.cos(headAngle - Math.PI / 6),
      arrowEndY - headSize * Math.sin(headAngle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowEndX - headSize * Math.cos(headAngle + Math.PI / 6),
      arrowEndY - headSize * Math.sin(headAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // 3. Trajectory Dots
    if (showPredict) {
      const dotCount = 7;
      for (let i = 1; i <= dotCount; i++) {
        const dotDist = arrowLength + i * 22;
        const dotX = player.x + normX * dotDist;
        const dotY = player.y + normY * dotDist;

        ctx.fillStyle = 'rgba(245, 232, 204, ' + (1 - i / (dotCount + 1)) * 0.7 + ')';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Power Percentage Badge near pen
    ctx.font = '700 12px "Space Mono", monospace';
    ctx.fillStyle = '#FF7138';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(powerRatio * 100)}% FLICK`, player.x, player.y - player.radius - 22);

    ctx.restore();
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none touch-none">
      <div className="relative rounded-2xl overflow-hidden shadow-board-floating border-2 border-slate-700/60 bg-[#101522] max-w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-auto max-h-[60vh] sm:max-h-[72vh] block cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Turn Status Overlay Badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none">
          <div
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-arcade font-bold tracking-wider flex items-center gap-1.5 sm:gap-2 ${
              turn === 'player'
                ? 'bg-[#101522]/90 border-[#FF7138] text-[#FF7138]'
                : 'bg-[#101522]/90 border-amber-400 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                turn === 'player' ? 'bg-[#FF7138]' : 'bg-amber-400'
              }`}
            />
            {turn === 'player' ? 'YOUR FLICK' : 'RIVAL AIMING...'}
          </div>
        </div>

        {/* Hint banner for first wave or desktop users */}
        {turn === 'player' && !isDraggingRef.current && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-11/12 max-w-xs text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#101522]/85 border border-[#3568F5]/40 text-[#F5E8CC] text-[10px] sm:text-xs font-body font-medium shadow-md">
              Drag on desk or use Touch Pad below
            </span>
          </div>
        )}
      </div>

      {/* Mobile Tactical Thumb Pad (Touch-friendly quick launcher) */}
      <div className="w-full max-w-xl mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#182033]/90 border border-slate-700/80 shadow-arcade flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-arcade text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-bold text-[#F5E8CC]">
            <span className="w-2 h-2 rounded-full bg-[#3568F5]" />
            QUICK THUMB CONTROLS
          </span>
          <span className="text-[9px] text-slate-400">
            {turn === 'player' ? 'READY TO STRIKE' : 'DEFENDING...'}
          </span>
        </div>

        {/* Quick Pen Switcher */}
        <div className="flex items-center gap-1.5 bg-[#101522] p-1 rounded-xl border border-slate-800">
          <span className="text-[9px] font-arcade text-slate-400 pl-1.5 uppercase font-bold shrink-0">PEN:</span>
          {Object.values(PENS).map(pen => {
            const isSelected = playerPenId === pen.id;
            return (
              <button
                key={pen.id}
                onClick={() => {
                  if (onSelectPen && pen.id !== playerPenId) {
                    sound.playClick();
                    onSelectPen(pen.id);
                  }
                }}
                className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-arcade font-bold flex items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#3568F5] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: pen.primaryColor }}
                />
                <span>{pen.name.replace(' Pen', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Angle & Power Selectors */}
        <div className="grid grid-cols-2 gap-2">
          {/* Aim Angle Preset */}
          <div className="flex items-center gap-1 bg-[#101522] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { sound.playClick(); setMobileAngle(-22); }}
              className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-arcade font-bold transition-all ${
                mobileAngle === -22 ? 'bg-[#3568F5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              ↖ LEFT
            </button>
            <button
              onClick={() => { sound.playClick(); setMobileAngle(0); }}
              className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-arcade font-bold transition-all ${
                mobileAngle === 0 ? 'bg-[#3568F5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              ↑ CENTER
            </button>
            <button
              onClick={() => { sound.playClick(); setMobileAngle(22); }}
              className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-arcade font-bold transition-all ${
                mobileAngle === 22 ? 'bg-[#3568F5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              ↗ RIGHT
            </button>
          </div>

          {/* Power Preset */}
          <div className="flex items-center gap-1 bg-[#101522] p-1 rounded-xl border border-slate-800">
            {[45, 80, 100].map(p => (
              <button
                key={p}
                onClick={() => { sound.playClick(); setMobilePower(p); }}
                className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-arcade font-bold transition-all ${
                  mobilePower === p ? 'bg-[#FF7138] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 45 ? 'SOFT' : p === 80 ? 'MED' : 'MAX'}
              </button>
            ))}
          </div>
        </div>

        {/* Big Launch Flick Strike Button */}
        <button
          disabled={turn !== 'player' || isPaused}
          onClick={launchTacticalFlick}
          className={`w-full py-2.5 sm:py-3 rounded-xl font-display text-lg sm:text-xl font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
            turn === 'player' && !isPaused
              ? 'bg-[#FF7138] hover:bg-[#ff8352] text-white shadow-arcade-orange cursor-pointer'
              : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
          }`}
        >
          <span>{turn === 'player' ? '⚡ FLICK STRIKE!' : 'WAITING FOR OPPONENT...'}</span>
        </button>
      </div>
    </div>
  );
};
