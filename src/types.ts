export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_OVER' | 'GAME_OVER';

export type PenId = 'ballpoint' | 'gel' | 'highlighter';

export interface PenDefinition {
  id: PenId;
  name: string;
  tagline: string;
  mass: number; // Knockdown power
  agility: number; // Turn speed and trajectory response
  friction: number; // Table grip (higher = rolls further)
  restitution: number; // Bounce elasticity
  length: number;
  radius: number;
  primaryColor: string;
  accentColor: string;
  tipColor: string;
  inkColor: string;
  clipColor: string;
  description: string;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface PenEntity {
  id: string;
  type: PenId;
  isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // radians
  vAngle: number; // angular velocity
  length: number;
  radius: number;
  mass: number;
  friction: number;
  restitution: number;
  primaryColor: string;
  accentColor: string;
  tipColor: string;
  inkColor: string;
  clipColor: string;
  isAlive: boolean;
  fallProgress: number; // 0 = on desk, >0 = falling off edge
  fallRotation: number;
  inkTrail: { x: number; y: number; alpha: number }[];
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'ink' | 'wood' | 'ring';
}

export interface HighScoreRecord {
  score: number;
  wave: number;
  penName: string;
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  screenShake: boolean;
  showTrajectory: boolean;
  dragSensitivity: number;
}
