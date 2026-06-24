export const TILE_W = 52;
export const TILE_H = 26;
export const WALL_H = 52;
export const HUD_HEIGHT = 58;
export const ACTION_PANEL_WIDTH = 120;

let gameScale = 1;
export function setGameScale(scale: number) {
  gameScale = scale;
}
export function getGameScale() {
  return gameScale;
}
export const GRID_W = 16;
export const GRID_H = 14;

export const REGIONS = {
  BOSS: 'boss',
  MAIN: 'main',
  HALL: 'hall',
} as const;

export const COLORS = {
  floorTileA: '#5bb5e8',
  floorTileB: '#4aa8dc',
  floorPlank: '#c4a574',
  floorPlankDark: '#a88654',
  bossCarpetA: '#7a2238',
  bossCarpetB: '#631c2f',
  wallFace: '#f5f7fa',
  wallTop: '#ffffff',
  wallEdge: '#b8c5d0',
  wallTrim: '#94a3b8',
  wallStripe: '#dce4ec',
  desk: '#94a3b8',
  deskTop: '#e8edf2',
  chair: '#64748b',
  monitor: '#e2e8f0',
  monitorBezel: '#475569',
  screen: '#38bdf8',
  screenGlow: '#7dd3fc',
  partition: '#64748b',
  partitionTop: '#94a3b8',
  plant: '#22c55e',
  plantDark: '#15803d',
  pot: '#ea580c',
  sofa: '#fb923c',
  vending: '#475569',
  coffee: '#dc2626',
  bossSuit: '#1e293b',
  bossShirt: '#f1f5f9',
  skin: '#fbbf77',
  skinShadow: '#e09850',
  outline: '#1e293b',
  hair: ['#1e1e1e', '#7c3aed', '#92400e', '#64748b', '#be123c'],
  shirt: ['#ffffff', '#dbeafe', '#fef08a', '#fce7f3', '#dcfce7'],
  pants: ['#334155', '#1e3a5f', '#374151', '#44403c', '#312e81'],
};

export const WORKER_STATES = {
  WORKING: 'working',
  BREAK: 'break',
  WALKING: 'walking',
  DROWSY: 'drowsy',
  SLEEPING: 'sleeping',
  DISTRACTING: 'distracting',
} as const;

export type WorkerState = (typeof WORKER_STATES)[keyof typeof WORKER_STATES];

export const GAME_PHASE = {
  INTRO: 'intro',
  NORMAL: 'normal',
  ALERT: 'alert',
  BOSS: 'boss',
  WON: 'won',
  LOST: 'lost',
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

export interface WakeAction {
  id: string;
  icon: string;
  label: string;
  wake: number;
  cooldown: number;
  range: number;
  needsWalk?: boolean;
  noise?: boolean;
  /** Works from anywhere in the office */
  remote?: boolean;
}

export interface BossAction {
  id: string;
  icon: string;
  label: string;
  delay: number;
  cooldown: number;
}

export const WAKE_ACTIONS: WakeAction[] = [
  { id: 'paper', icon: '📄', label: 'Paper Ball', wake: 18, cooldown: 1.2, range: 99 },
  { id: 'cough', icon: '🗣️', label: 'Clear Throat', wake: 10, cooldown: 0.6, range: 99 },
  { id: 'phone', icon: '📞', label: 'Ring Phone', wake: 28, cooldown: 2.5, range: 99, remote: true },
  { id: 'email', icon: '📧', label: 'Send Email', wake: 15, cooldown: 1.8, range: 99, remote: true },
  { id: 'coffee', icon: '☕', label: 'Bring Coffee', wake: 35, cooldown: 4, range: 99, needsWalk: true },
  { id: 'splash', icon: '💧', label: 'Splash Water', wake: 30, cooldown: 3, range: 99, needsWalk: true },
  { id: 'slam', icon: '👊', label: 'Slam Desk', wake: 22, cooldown: 2, range: 99, needsWalk: true },
  { id: 'music', icon: '🔊', label: 'Blast Music', wake: 32, cooldown: 3.5, range: 99, remote: true, noise: true },
  { id: 'poke', icon: '👉', label: 'Shoulder Poke', wake: 12, cooldown: 0.8, range: 99, needsWalk: true },
];

export const BOSS_ACTIONS: BossAction[] = [
  { id: 'chat', icon: '💬', label: 'Small Talk', delay: 4.5, cooldown: 3 },
  { id: 'report', icon: '📊', label: 'Fake Report', delay: 6, cooldown: 5 },
  { id: 'coffee_boss', icon: '☕', label: 'Offer Coffee', delay: 5, cooldown: 4 },
  { id: 'meeting', icon: '📅', label: 'Urgent Meeting', delay: 8, cooldown: 8 },
];

export const CONFIG = {
  progressMax: 100,
  progressDecaySleep: 8,
  progressGainWork: 2.5,
  drowsyThreshold: 55,
  sleepThreshold: 100,
  bossTriggerProgress: 35,
  bossSpeed: 1.8,
  workerSpeed: 0.09,
};

export interface GridPos {
  gx: number;
  gy: number;
}

export function isoToScreen(gx: number, gy: number, originX: number, originY: number) {
  const s = gameScale;
  return {
    x: originX + (gx - gy) * (TILE_W / 2) * s,
    y: originY + (gx + gy) * (TILE_H / 2) * s,
  };
}

export function screenToIso(sx: number, sy: number, originX: number, originY: number): GridPos {
  const s = gameScale;
  const rx = sx - originX;
  const ry = sy - originY;
  return {
    gx: (rx / ((TILE_W / 2) * s) + ry / ((TILE_H / 2) * s)) / 2,
    gy: (ry / ((TILE_H / 2) * s) - rx / ((TILE_W / 2) * s)) / 2,
  };
}

export function dist(a: { wx: number; wy: number }, b: { wx: number; wy: number }) {
  return Math.hypot(a.wx - b.wx, a.wy - b.wy);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
