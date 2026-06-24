import type { SkCanvas } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import {
  BOSS_ACTIONS,
  CONFIG,
  GAME_PHASE,
  GamePhase,
  WAKE_ACTIONS,
  WakeAction,
  WORKER_STATES,
  clamp,
  dist,
  lerp,
} from './constants';
import { Boss, Effect, Worker, createWorkers } from './entities';
import { DIFFICULTY_SETTINGS, type DifficultySettings } from './difficulty';
import type { CharacterProfile, Difficulty } from './profiles';
import { drawScene } from './skiaRenderer';
import type { SkImage } from '@shopify/react-native-skia';
import type { BgLayout } from './sceneLayout';
import { normToScreen, screenToNorm } from './sceneLayout';
export interface GameCallbacks {
  onPhaseChange?: (phase: GamePhase) => void;
  onProgressChange?: (p: number) => void;
  onStatusChange?: (msg: string) => void;
  onWakeMeterChange?: (p: number) => void;
  onSleepyWorker?: () => void;
}

export class GameEngine {
  workers = createWorkers();
  boss = new Boss();
  effects: Effect[] = [];
  phase: GamePhase = GAME_PHASE.INTRO;
  progress = CONFIG.progressMax;
  gameTime = 12 * 60;
  score = 0;
  round = 1;
  selectedWorker: Worker | null = null;
  originX = 0;
  originY = 60;
  width = 0;
  height = 0;
  statusText = '';
  alertShown = false;
  sleepyWorkerId: string | null = null;
  drowsyStartDelay = 4;
  canvasHeight = 0;
  difficulty: DifficultySettings = DIFFICULTY_SETTINGS.normal;
  drowsyRate = DIFFICULTY_SETTINGS.normal.drowsyRate;
  progressDecaySleep = DIFFICULTY_SETTINGS.normal.progressDecaySleep;
  bossSpeed = DIFFICULTY_SETTINGS.normal.bossSpeed;
  bossTriggerProgress = DIFFICULTY_SETTINGS.normal.bossTriggerProgress;
  backgroundImage: SkImage | null = null;
  spriteSheet: SkImage | null = null;
  bgLayout: BgLayout | null = null;
  private skyPaintCache = Skia.Paint();
  private callbacks: GameCallbacks = {};

  skyPaint() {
    this.skyPaintCache.setColor(Skia.Color('#5bb5e8'));
    return this.skyPaintCache;
  }

  setSpriteSheet(image: SkImage | null) {
    this.spriteSheet = image;
  }
  configure(profiles: CharacterProfile[], difficultyId: Difficulty) {
    this.difficulty = DIFFICULTY_SETTINGS[difficultyId];
    this.drowsyRate = this.difficulty.drowsyRate;
    this.progressDecaySleep = this.difficulty.progressDecaySleep;
    this.bossSpeed = this.difficulty.bossSpeed;
    this.bossTriggerProgress = this.difficulty.bossTriggerProgress;
    this.workers = createWorkers(profiles);
    this.boss = new Boss();
    this.effects = [];
    this.score = 0;
    this.round = 1;
  }

  setBackgroundImage(image: SkImage | null) {
    this.backgroundImage = image;
  }

  setCallbacks(cb: GameCallbacks) {
    this.callbacks = cb;
  }

  resize(width: number, height: number, canvasHeight?: number) {
    this.width = width;
    this.height = height;
    this.canvasHeight = canvasHeight ?? height;
  }
  startRound() {
    this.phase = GAME_PHASE.NORMAL;
    this.progress = CONFIG.progressMax;
    this.gameTime = 12 * 60;
    this.alertShown = false;
    this.boss.reset();
    this.effects = [];
    this.drowsyStartDelay =
      this.difficulty.drowsyDelayMin +
      Math.random() * (this.difficulty.drowsyDelayMax - this.difficulty.drowsyDelayMin);
    this.sleepyWorkerId = null;

    for (const w of this.workers) {
      w.wakeMeter = 0;
      w.isSleepyTarget = false;
      w.state = WORKER_STATES.WORKING;
      w.onMission = null;
      w.bubble = null;
      w.goToDesk();
    }

    this.setStatus('Tap a coworker on the left panel, then pick a wake-up action!');
    this.callbacks.onWakeMeterChange?.(0);
    this.callbacks.onPhaseChange?.(this.phase);
    this.callbacks.onProgressChange?.(this.progress);
  }

  update(dt: number) {
    if (this.phase === GAME_PHASE.INTRO || this.phase === GAME_PHASE.WON || this.phase === GAME_PHASE.LOST) {
      return;
    }

    this.gameTime += dt * 2;
    this.tickProgress(dt);
    this.tickDrowsy(dt);

    for (const w of this.workers) w.update(dt, this);
    this.boss.update(dt, this);
    for (const e of this.effects) e.update(dt);
    this.effects = this.effects.filter((e) => !e.done);

    this.checkBossTrigger();
    this.checkWin();
    this.callbacks.onWakeMeterChange?.(this.getWakeMeterPercent());
  }

  drawSkia(canvas: SkCanvas, time: number) {
    drawScene(canvas, this, time);
  }

  getWakeMeterPercent() {
    const sleepy = this.getSleepyWorker();
    if (!sleepy) return 0;
    return clamp((sleepy.wakeMeter / CONFIG.sleepThreshold) * 100, 0, 100);
  }

  private tickProgress(dt: number) {
    const sleepy = this.getSleepyWorker();
    if (sleepy?.state === WORKER_STATES.SLEEPING) {
      this.progress -= this.progressDecaySleep * dt;
    } else if (this.phase === GAME_PHASE.NORMAL) {
      this.progress += CONFIG.progressGainWork * dt * 0.3;
    }
    this.progress = clamp(this.progress, 0, CONFIG.progressMax);
    this.callbacks.onProgressChange?.(this.progress);

    if (this.progress <= this.bossTriggerProgress && !this.alertShown && this.sleepyWorkerId) {
      this.phase = GAME_PHASE.ALERT;
      this.alertShown = true;
      this.setStatus('Productivity dropping! Wake them up before the boss notices!');
      this.callbacks.onPhaseChange?.(this.phase);
    }
  }

  private tickDrowsy(dt: number) {
    if (this.sleepyWorkerId) return;
    this.drowsyStartDelay -= dt;
    if (this.drowsyStartDelay > 0) return;

    const candidates = this.workers.filter((w) => w.state === WORKER_STATES.WORKING);
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (!target) return;

    target.isSleepyTarget = true;
    target.wakeMeter = 20;
    target.state = WORKER_STATES.DROWSY;
    target.bubble = '💤';
    target.bubbleTimer = 999;
    this.sleepyWorkerId = target.id;
    this.phase = GAME_PHASE.ALERT;
    this.setStatus(`${target.name} is nodding off! Pick a coworker, then choose an action.`);
    this.callbacks.onPhaseChange?.(this.phase);
    this.callbacks.onSleepyWorker?.();
  }

  private checkBossTrigger() {
    const sleepy = this.getSleepyWorker();
    if (!sleepy || sleepy.state !== WORKER_STATES.SLEEPING || this.boss.active) return;
    this.phase = GAME_PHASE.BOSS;
    this.boss.spawn();
    this.setStatus('THE BOSS IS COMING! Stall him or wake your coworker!');
    this.callbacks.onPhaseChange?.(this.phase);
  }

  private checkWin() {
    const sleepy = this.getSleepyWorker();
    if (sleepy && !sleepy.isSleepyTarget) this.winRound();
  }

  winRound() {
    this.score += Math.floor(this.progress) * this.round;
    this.round += 1;
    this.phase = GAME_PHASE.WON;
    this.boss.reset();
    this.sleepyWorkerId = null;
    this.setStatus(`Shift saved! Score: ${this.score}`);
    this.callbacks.onPhaseChange?.(this.phase);
  }

  lose(reason: string) {
    this.phase = GAME_PHASE.LOST;
    this.setStatus(reason);
    this.callbacks.onPhaseChange?.(this.phase);
  }

  getSleepyWorker() {
    return this.workers.find((w) => w.id === this.sleepyWorkerId);
  }

  handleTap(screenX: number, screenY: number) {
    if (this.phase === GAME_PHASE.INTRO || this.phase === GAME_PHASE.WON || this.phase === GAME_PHASE.LOST) {
      return null;
    }
    if (!this.bgLayout) return null;

    const { wx, wy } = screenToNorm(screenX, screenY, this.bgLayout);
    const worker = [...this.workers].reverse().find((w) => w.hitTest(wx, wy));
    if (worker) {
      for (const w of this.workers) w.selected = false;
      worker.selected = true;
      this.selectedWorker = worker;
      return { type: 'worker' as const, worker };
    }

    if (this.boss.active && this.boss.hitTest(wx, wy)) {
      return { type: 'boss' as const };
    }

    for (const w of this.workers) w.selected = false;
    this.selectedWorker = null;
    return null;
  }
  getActorWorkers() {
    const sleepy = this.getSleepyWorker();
    return this.workers.filter((w) => w.id !== sleepy?.id);
  }

  executeWakeAction(actor: Worker, action: WakeAction) {
    const sleepy = this.getSleepyWorker();
    if (!sleepy || !actor.canUseAction(action.id)) return false;

    const nearSleepy = dist(actor, sleepy) <= 0.12;
    const canDoInstantly = action.remote || !action.needsWalk || nearSleepy;

    if (!canDoInstantly) {
      actor.setCooldown(action.id, action.cooldown);
      actor.onMission = {
        type: 'walk',
        wx: sleepy.wx + 0.02,
        wy: sleepy.wy + 0.01,
        action,
        onArrive: (w, game) => {
          w.onMission = null;
          game.resolveWake(w, action);
        },
      };      this.setStatus(`${actor.name} is heading over to help…`);
      return true;
    }

    actor.setCooldown(action.id, action.cooldown);
    this.resolveWake(actor, action);
    return true;
  }

  resolveWake(actor: Worker, action: WakeAction) {
    const sleepy = this.getSleepyWorker();
    if (!sleepy) return;

    this.effects.push(
      new Effect(action.id, actor, sleepy, action.id === 'paper' ? 0.5 : 0.35, { icon: action.icon }),
    );

    if (action.noise && this.boss.active) this.boss.delay(1.5);

    const woke = sleepy.applyWake(action.wake);
    this.setStatus(`${actor.name}: ${action.label}!${woke ? " They're awake!" : ''}`);

    if (woke) {
      this.progress = clamp(this.progress + 25, 0, CONFIG.progressMax);
      this.callbacks.onProgressChange?.(this.progress);
    }
  }

  executeBossAction(actor: Worker, action: (typeof BOSS_ACTIONS)[0]) {
    if (!this.boss.active || !actor.canUseAction(action.id)) return false;

    if (dist(actor, this.boss) > 0.15) {
      this.setStatus('Get closer to the boss to stall him!');
      return false;
    }

    actor.setCooldown(action.id, action.cooldown);
    this.boss.delay(action.delay);
    actor.onMission = { type: 'distract', timer: action.delay, icon: action.icon };
    actor.wx = lerp(actor.wx, this.boss.wx, 0.5);
    actor.wy = lerp(actor.wy, this.boss.wy, 0.5);    this.effects.push(new Effect('chat', actor, this.boss, 0.4, { icon: action.icon }));
    this.setStatus(`${actor.name} is stalling the boss…`);
    return true;
  }

  setStatus(msg: string) {
    this.statusText = msg;
    this.callbacks.onStatusChange?.(msg);
  }

  formatClock() {
    const mins = Math.floor(this.gameTime) % (12 * 60);
    const h = Math.floor(mins / 60) || 12;
    const m = Math.floor(mins % 60);
    const ampm = Math.floor(this.gameTime / (12 * 60)) % 2 === 0 ? 'AM' : 'PM';
    return `${ampm} ${h}:${m.toString().padStart(2, '0')}`;
  }

  getBubbleOverlays() {
    const overlays: { x: number; y: number; text: string; key: string }[] = [];
    if (!this.bgLayout) return overlays;

    const add = (wx: number, wy: number, text: string | null, key: string) => {
      if (!text) return;
      const pos = normToScreen(wx, wy, this.bgLayout!);
      overlays.push({ x: pos.x, y: pos.y - this.bgLayout!.drawH * 0.08, text, key });
    };

    for (const w of this.workers) {
      if (w.bubble) add(w.wx, w.wy, w.bubble, w.id);
    }
    if (this.boss.active) {
      add(this.boss.wx, this.boss.wy, this.boss.delayTimer > 0 ? '💬' : '👁️', 'boss');
    }
    return overlays;
  }}

export { WAKE_ACTIONS, BOSS_ACTIONS };
