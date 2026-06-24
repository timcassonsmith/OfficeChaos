import {
  BOSS_ACTIONS,
  COLORS,
  CONFIG,
  GAME_PHASE,
  WAKE_ACTIONS,
  WakeAction,
  WORKER_STATES,
  WorkerState,
  clamp,
  dist,
  lerp,
  pickRandom,
  uid,
} from './constants';
import type { CharacterProfile } from './profiles';
import { pickSpriteId } from './spriteAtlas';
import { SCENE_DESKS, SCENE_POI, type SceneDesk, type ScenePoint } from './sceneLayout';
import type { GameEngine } from './GameEngine';

export { WAKE_ACTIONS, BOSS_ACTIONS };
export type { ScenePoint };

export class Worker {
  id = uid();
  index: number;
  name: string;
  wx: number;
  wy: number;
  targetWx: number;
  targetWy: number;
  desk: SceneDesk;
  spriteId: string;
  hairColor: string;
  outfitColor: string;
  pantsColor: string;
  skinColor: string;
  sex: 'male' | 'female';
  shirtColor: string;
  state: WorkerState = WORKER_STATES.WORKING;
  wakeMeter = 0;
  isSleepyTarget = false;
  stateTimer = 0;
  cooldowns: Record<string, number> = {};
  bubble: string | null = null;
  bubbleTimer = 0;
  facing = 1;
  anim = 0;
  selected = false;
  onMission: Mission | null = null;
  atDesk = true;
  typingPhase = 0;
  breakSpot: ScenePoint | null = null;

  constructor(index: number, desk: SceneDesk, profile?: CharacterProfile) {
    this.index = index;
    const defaults: CharacterProfile = {
      name: ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan'][index] ?? `Worker ${index + 1}`,
      sex: index % 2 === 0 ? 'male' : 'female',
      hairColor: COLORS.hair[index % COLORS.hair.length],
      skinColor: COLORS.skin,
      outfitColor: COLORS.shirt[index % COLORS.shirt.length],
      pantsColor: COLORS.pants[index % COLORS.pants.length],
    };
    const p = profile ?? defaults;
    this.name = p.name;
    this.sex = p.sex;
    this.hairColor = p.hairColor;
    this.skinColor = p.skinColor;
    this.outfitColor = p.outfitColor;
    this.pantsColor = p.pantsColor;
    this.shirtColor = p.outfitColor;
    this.spriteId = pickSpriteId(p, index);
    this.desk = desk;
    this.wx = desk.seatWx;
    this.wy = desk.seatWy;
    this.targetWx = desk.seatWx;
    this.targetWy = desk.seatWy;
    this.facing = desk.seatWx < 0.5 ? 1 : -1;
  }

  update(dt: number, game: GameEngine) {
    this.anim += dt;
    this.typingPhase += dt;
    this.stateTimer += dt;

    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0 && !this.isSleepyTarget) this.bubble = null;
    }
    for (const k of Object.keys(this.cooldowns)) {
      this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }

    if (this.onMission) {
      this.updateMission(dt, game);
      return;
    }
    if (this.state === WORKER_STATES.DISTRACTING) return;

    if (this.isSleepyTarget) {
      this.updateSleepy(dt, game);
      this.snapToSeat(dt);
      return;
    }

    if (game.phase === GAME_PHASE.NORMAL || game.phase === GAME_PHASE.ALERT) {
      if (game.phase === GAME_PHASE.ALERT && !this.isSleepyTarget) {
        this.state = WORKER_STATES.WORKING;
        this.goToDesk();
      } else {
        this.updateRoutine();
      }
    } else if (game.phase === GAME_PHASE.BOSS && !this.isSleepyTarget && !this.onMission) {
      this.state = WORKER_STATES.WORKING;
      this.goToDesk();
    }
    this.moveTowardTarget(dt);
    this.updateActivityBubble();
  }

  private updateSleepy(dt: number, game: GameEngine) {
    if (this.state === WORKER_STATES.SLEEPING) return;
    const rate = (game.drowsyRate ?? 3.5) * (game.phase === GAME_PHASE.BOSS ? 1.4 : 1);
    this.wakeMeter += dt * rate;
    if (this.wakeMeter >= CONFIG.drowsyThreshold && this.state !== WORKER_STATES.DROWSY) {
      this.state = WORKER_STATES.DROWSY;
      this.bubble = '💤';
      this.bubbleTimer = 999;
    }
    if (this.wakeMeter >= CONFIG.sleepThreshold) {
      this.state = WORKER_STATES.SLEEPING;
      this.bubble = '😴';
      this.bubbleTimer = 999;
    }
  }

  private snapToSeat(dt: number) {
    this.targetWx = this.desk.seatWx;
    this.targetWy = this.desk.seatWy;
    this.wx = lerp(this.wx, this.desk.seatWx, Math.min(1, dt * 8));
    this.wy = lerp(this.wy, this.desk.seatWy, Math.min(1, dt * 8));
    this.atDesk = true;
    this.facing = this.desk.seatWx < 0.5 ? 1 : -1;
  }

  private updateRoutine() {
    if (this.stateTimer <= pickDuration(this.state)) return;
    this.pickNextRoutine();
    this.stateTimer = 0;
  }

  private pickNextRoutine() {
    const roll = Math.random();
    if (roll < 0.88) {
      this.state = WORKER_STATES.WORKING;
      this.goToDesk();
    } else if (roll < 0.96) {
      this.state = WORKER_STATES.BREAK;
      const poi = pickRandom([SCENE_POI.vending, SCENE_POI.coffee, SCENE_POI.sofa, SCENE_POI.cooler]);
      this.breakSpot = { ...poi };
      this.setTarget(poi.wx, poi.wy);
      this.atDesk = false;
    } else {
      this.state = WORKER_STATES.WALKING;
      this.atDesk = false;
      this.setTarget(
        clamp(this.desk.seatWx + (Math.random() * 0.06 - 0.03), 0.12, 0.88),
        clamp(this.desk.seatWy + (Math.random() * 0.04 - 0.02), 0.45, 0.85),
      );
    }
  }

  private updateActivityBubble() {
    if (this.isSleepyTarget || this.onMission) return;
    if (this.state === WORKER_STATES.WORKING && this.atDesk) {
      if (Math.sin(this.typingPhase * 0.8) > 0.85) {
        this.bubble = pickRandom(['⌨️', '📊', '📝', '💼', '📧']);
        this.bubbleTimer = 2.2;
      }
    } else if (this.state === WORKER_STATES.BREAK && this.breakSpot && dist(this, this.breakSpot) < 0.03) {
      this.bubble = pickRandom(['☕', '🥤', '💬']);
      this.bubbleTimer = 2.5;
    }
  }

  goToDesk() {
    this.targetWx = this.desk.seatWx;
    this.targetWy = this.desk.seatWy;
    this.atDesk = false;
  }

  setTarget(wx: number, wy: number) {
    this.targetWx = wx;
    this.targetWy = wy;
  }

  moveTowardTarget(dt: number) {
    const dx = this.targetWx - this.wx;
    const dy = this.targetWy - this.wy;
    const d = Math.hypot(dx, dy);
    if (d < 0.008) {
      this.wx = this.targetWx;
      this.wy = this.targetWy;
      if (this.state === WORKER_STATES.WORKING) this.atDesk = true;
      return;
    }
    const speed = CONFIG.workerSpeed * dt;
    this.wx += (dx / d) * speed;
    this.wy += (dy / d) * speed;
    this.facing = dx >= 0 ? 1 : -1;
    this.atDesk = false;
  }

  private updateMission(dt: number, game: GameEngine) {
    const m = this.onMission!;
    if (m.type === 'walk') {
      this.setTarget(m.wx, m.wy);
      this.moveTowardTarget(dt);
      if (dist(this, m) < 0.025) m.onArrive?.(this, game);
    } else if (m.type === 'distract') {
      this.state = WORKER_STATES.DISTRACTING;
      m.timer -= dt;
      this.bubble = m.icon ?? '💬';
      this.bubbleTimer = 999;
      if (m.timer <= 0) {
        this.onMission = null;
        this.state = WORKER_STATES.WALKING;
        this.bubble = null;
        game.boss.delayTimer = 0;
      }
    }
  }

  applyWake(amount: number): boolean {
    if (!this.isSleepyTarget) return false;
    this.wakeMeter = Math.max(0, this.wakeMeter - amount);
    if (this.wakeMeter < CONFIG.drowsyThreshold) {
      this.state = WORKER_STATES.WORKING;
      this.bubble = '😅';
      this.bubbleTimer = 2;
    }
    if (this.wakeMeter <= 0) {
      this.isSleepyTarget = false;
      this.state = WORKER_STATES.WORKING;
      this.bubble = '✨';
      this.bubbleTimer = 2;
      return true;
    }
    return false;
  }

  canUseAction(actionId: string) {
    return (this.cooldowns[actionId] ?? 0) <= 0;
  }

  setCooldown(actionId: string, seconds: number) {
    this.cooldowns[actionId] = seconds;
  }

  hitTest(wx: number, wy: number) {
    return dist(this, { wx, wy }) < 0.045;
  }

  isSitting() {
    return (
      (this.state === WORKER_STATES.WORKING ||
        this.state === WORKER_STATES.DROWSY ||
        this.state === WORKER_STATES.SLEEPING) &&
      (this.atDesk || this.isSleepyTarget) &&
      this.onMission?.type !== 'walk'
    );
  }
}

export class Boss {
  active = false;
  wx = SCENE_POI.bossDoor.wx;
  wy = SCENE_POI.bossDoor.wy;
  targetWx = SCENE_POI.bossDoor.wx;
  targetWy = SCENE_POI.bossDoor.wy;
  delayTimer = 0;
  facing = 1;
  anim = 0;

  reset() {
    this.active = false;
    this.wx = SCENE_POI.bossDoor.wx;
    this.wy = SCENE_POI.bossDoor.wy + 0.02;
    this.delayTimer = 0;
  }

  spawn() {
    this.active = true;
    this.wx = SCENE_POI.bossDoor.wx;
    this.wy = SCENE_POI.bossDoor.wy + 0.02;
    this.delayTimer = 0;
  }

  update(dt: number, game: GameEngine) {
    if (!this.active) {
      this.anim += dt * 0.5;
      return;
    }
    this.anim += dt;
    if (this.delayTimer > 0) {
      this.delayTimer -= dt;
      return;
    }
    const sleepy = game.getSleepyWorker();
    if (!sleepy) return;

    this.targetWx = sleepy.wx;
    this.targetWy = sleepy.wy;
    const dx = this.targetWx - this.wx;
    const dy = this.targetWy - this.wy;
    const d = Math.hypot(dx, dy);
    if (d < 0.05) {
      if (sleepy.state === WORKER_STATES.SLEEPING || sleepy.wakeMeter >= CONFIG.sleepThreshold) {
        game.lose('The boss caught someone sleeping on the job!');
      }
      return;
    }
    const speed = game.bossSpeed * dt;
    this.wx += (dx / d) * speed;
    this.wy += (dy / d) * speed;
    this.facing = dx >= 0 ? 1 : -1;
  }

  delay(seconds: number) {
    this.delayTimer = Math.max(this.delayTimer, seconds);
  }

  hitTest(wx: number, wy: number) {
    return this.active && dist(this, { wx, wy }) < 0.05;
  }
}

export class Effect {
  id = uid();
  t = 0;
  done = false;

  constructor(
    public type: string,
    public from: ScenePoint,
    public to: ScenePoint | null,
    public duration = 0.6,
    public data: { icon?: string } = {},
  ) {}

  update(dt: number) {
    this.t += dt;
    if (this.t >= this.duration) this.done = true;
  }
}

type Mission =
  | { type: 'walk'; wx: number; wy: number; action?: WakeAction; onArrive?: (w: Worker, g: GameEngine) => void }
  | { type: 'distract'; timer: number; icon?: string };

function pickDuration(state: WorkerState) {
  switch (state) {
    case WORKER_STATES.WORKING:
      return 20 + Math.random() * 14;
    case WORKER_STATES.BREAK:
      return 4 + Math.random() * 3;
    case WORKER_STATES.WALKING:
      return 3 + Math.random() * 2;
    default:
      return 5;
  }
}

export function createWorkers(profiles?: CharacterProfile[]) {
  return SCENE_DESKS.slice(0, 6).map((desk, i) => new Worker(i, desk, profiles?.[i]));
}
