import {
  BOSS_ACTIONS,
  CHAT_PHRASES,
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
import {
  SCENE_DESKS,
  SCENE_POI,
  type SceneDesk,
  type ScenePoint,
  findPath,
  pushOutOfObstacles,
} from './sceneLayout';
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
  /** Remaining waypoints (not including the current target). */
  waypoints: ScenePoint[] = [];
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
  chatPartnerId: string | null = null;
  chatDuration = 6;

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
    this.atDesk = true;
    this.facing = desk.seatWx < 0.5 ? 1 : -1;
  }

  /** Instantly seat this worker at their desk (used at round start / becoming sleepy). */
  seatAtDesk() {
    this.wx = this.desk.seatWx;
    this.wy = this.desk.seatWy;
    this.targetWx = this.desk.seatWx;
    this.targetWy = this.desk.seatWy;
    this.waypoints = [];
    this.atDesk = true;
    this.onMission = null;
    this.chatPartnerId = null;
    this.facing = this.desk.seatWx < 0.5 ? 1 : -1;
    if (
      this.state !== WORKER_STATES.DROWSY &&
      this.state !== WORKER_STATES.SLEEPING &&
      this.state !== WORKER_STATES.DISTRACTING
    ) {
      this.state = WORKER_STATES.WORKING;
    }
  }

  update(dt: number, game: GameEngine) {
    this.anim += dt;
    this.typingPhase += dt;
    this.stateTimer += dt;

    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0 && !this.isSleepyTarget && this.state !== WORKER_STATES.CHATTING) {
        this.bubble = null;
      }
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

    if (this.state === WORKER_STATES.CHATTING) {
      this.updateChat(dt, game);
      return;
    }

    if (game.phase === GAME_PHASE.NORMAL || game.phase === GAME_PHASE.ALERT) {
      if (game.phase === GAME_PHASE.ALERT && !this.isSleepyTarget) {
        // Only head back once — don't reset every frame
        if (!this.atDesk && this.state !== WORKER_STATES.WALKING) {
          this.state = WORKER_STATES.WORKING;
          this.goToDesk();
        } else if (this.atDesk) {
          this.state = WORKER_STATES.WORKING;
        }
      } else if (game.phase === GAME_PHASE.NORMAL) {
        this.updateRoutine(game);
      }
    } else if (game.phase === GAME_PHASE.BOSS && !this.isSleepyTarget && !this.onMission) {
      if (!this.atDesk) {
        this.state = WORKER_STATES.WORKING;
        this.goToDesk();
      } else {
        this.state = WORKER_STATES.WORKING;
      }
    }
    this.moveTowardTarget(dt);
    this.updateActivityBubble();
  }

  private updateSleepy(dt: number, game: GameEngine) {
    // Cycle clear "zzz" text so sleep is obvious
    const zCycle = Math.floor(this.anim * 1.5) % 3;
    this.bubble = zCycle === 0 ? 'z' : zCycle === 1 ? 'zz' : 'zzz';
    this.bubbleTimer = 999;

    if (this.state === WORKER_STATES.SLEEPING) return;
    const rate = (game.drowsyRate ?? 3.5) * (game.phase === GAME_PHASE.BOSS ? 1.4 : 1);
    this.wakeMeter += dt * rate;
    if (this.wakeMeter >= CONFIG.drowsyThreshold && this.state !== WORKER_STATES.DROWSY) {
      this.state = WORKER_STATES.DROWSY;
    }
    if (this.wakeMeter >= CONFIG.sleepThreshold) {
      this.state = WORKER_STATES.SLEEPING;
    }
  }

  private snapToSeat(dt: number) {
    this.targetWx = this.desk.seatWx;
    this.targetWy = this.desk.seatWy;
    this.waypoints = [];
    this.wx = lerp(this.wx, this.desk.seatWx, Math.min(1, dt * 8));
    this.wy = lerp(this.wy, this.desk.seatWy, Math.min(1, dt * 8));
    if (dist(this, { wx: this.desk.seatWx, wy: this.desk.seatWy }) < 0.008) {
      this.wx = this.desk.seatWx;
      this.wy = this.desk.seatWy;
    }
    this.atDesk = true;
    this.facing = this.desk.seatWx < 0.5 ? 1 : -1;
  }

  private updateRoutine(game: GameEngine) {
    if (this.stateTimer <= pickDuration(this.state)) return;
    this.pickNextRoutine(game);
    this.stateTimer = 0;
  }

  private pickNextRoutine(game: GameEngine) {
    const roll = Math.random();
    if (roll < 0.72) {
      this.state = WORKER_STATES.WORKING;
      this.goToDesk();
    } else if (roll < 0.84) {
      this.startChat(game);
    } else if (roll < 0.94) {
      this.state = WORKER_STATES.BREAK;
      const poi = pickRandom([SCENE_POI.vending, SCENE_POI.coffee, SCENE_POI.sofa, SCENE_POI.cooler]);
      this.breakSpot = { ...poi };
      this.startJourney(poi.wx, poi.wy);
      this.atDesk = false;
    } else {
      this.state = WORKER_STATES.WALKING;
      this.atDesk = false;
      const wanderX = 0.32 + Math.random() * 0.36;
      const wanderY = clamp(this.desk.seatWy + (Math.random() * 0.12 - 0.06), 0.52, 0.88);
      this.startJourney(wanderX, wanderY);
    }
  }

  private startChat(game: GameEngine) {
    const partners = game.workers.filter(
      (w) =>
        w.id !== this.id &&
        !w.isSleepyTarget &&
        !w.onMission &&
        w.state !== WORKER_STATES.CHATTING &&
        w.state !== WORKER_STATES.DISTRACTING,
    );
    if (partners.length === 0) {
      this.state = WORKER_STATES.WORKING;
      this.goToDesk();
      return;
    }
    const partner = pickRandom(partners);
    // Meet in the aisle between them
    const meetWx = clamp((this.wx + partner.wx) / 2, 0.34, 0.66);
    const meetWy = clamp((this.wy + partner.wy) / 2, 0.52, 0.82);

    this.state = WORKER_STATES.WALKING;
    this.atDesk = false;
    this.chatPartnerId = partner.id;
    this.onMission = {
      type: 'walk',
      wx: meetWx - 0.015,
      wy: meetWy,
      pathStarted: false,
      onArrive: (w, g) => {
        w.onMission = null;
        w.state = WORKER_STATES.CHATTING;
        w.stateTimer = 0;
        w.chatDuration = 5 + Math.random() * 3;
        w.bubble = pickRandom(CHAT_PHRASES);
        w.bubbleTimer = 3;
        const other = g.workers.find((x) => x.id === w.chatPartnerId);
        if (other && !other.isSleepyTarget) {
          other.onMission = null;
          other.chatPartnerId = w.id;
          other.state = WORKER_STATES.CHATTING;
          other.stateTimer = 0;
          other.chatDuration = w.chatDuration;
          other.bubble = pickRandom(CHAT_PHRASES);
          other.bubbleTimer = 3;
          other.facing = other.wx < w.wx ? 1 : -1;
          w.facing = w.wx < other.wx ? 1 : -1;
        }
      },
    };

    // Partner also walks to the meetup if free
    if (!partner.onMission && partner.state !== WORKER_STATES.CHATTING) {
      partner.state = WORKER_STATES.WALKING;
      partner.atDesk = false;
      partner.chatPartnerId = this.id;
      partner.onMission = {
        type: 'walk',
        wx: meetWx + 0.015,
        wy: meetWy,
        pathStarted: false,
        onArrive: (w) => {
          w.onMission = null;
          if (w.state !== WORKER_STATES.CHATTING) {
            w.state = WORKER_STATES.CHATTING;
            w.stateTimer = 0;
          }
        },
      };
    }
  }

  private updateChat(_dt: number, game: GameEngine) {
    const partner = game.workers.find((w) => w.id === this.chatPartnerId);
    if (!partner || partner.isSleepyTarget) {
      this.endChat();
      return;
    }
    if (this.bubbleTimer <= 0) {
      this.bubble = pickRandom(CHAT_PHRASES);
      this.bubbleTimer = 2.5 + Math.random();
    }
    this.facing = partner.wx >= this.wx ? 1 : -1;
    if (this.stateTimer > this.chatDuration) {
      this.endChat();
      if (partner.chatPartnerId === this.id && partner.state === WORKER_STATES.CHATTING) {
        partner.endChat();
      }
    }
  }

  private endChat() {
    this.chatPartnerId = null;
    this.state = WORKER_STATES.WORKING;
    this.stateTimer = 0;
    this.bubble = null;
    this.goToDesk();
  }

  private updateActivityBubble() {
    if (this.isSleepyTarget || this.onMission) return;
    if (this.state === WORKER_STATES.WORKING && this.atDesk) {
      // Only refresh when the previous bubble has expired — prevents emoji thrashing
      if (this.bubbleTimer <= 0) {
        this.bubble = pickRandom(['⌨️', '📊', '📝', '💼', '📧']);
        this.bubbleTimer = 4.5 + Math.random() * 2.5;
      }
    } else if (this.state === WORKER_STATES.BREAK && this.breakSpot && dist(this, this.breakSpot) < 0.03) {
      if (this.bubbleTimer <= 0) {
        this.bubble = pickRandom(['☕', '🥤', '💬']);
        this.bubbleTimer = 3.5 + Math.random() * 1.5;
      }
    }
  }

  goToDesk() {
    // Already seated — stay put
    if (
      this.atDesk &&
      dist(this, { wx: this.desk.seatWx, wy: this.desk.seatWy }) < 0.02 &&
      this.waypoints.length === 0
    ) {
      this.targetWx = this.desk.seatWx;
      this.targetWy = this.desk.seatWy;
      return;
    }
    this.startJourney(this.desk.seatWx, this.desk.seatWy);
    this.atDesk = false;
  }

  /**
   * Plan a collision-free path to (wx, wy) and begin moving.
   * Replaces the old bare setTarget().
   */
  startJourney(wx: number, wy: number) {
    const path = findPath({ wx: this.wx, wy: this.wy }, { wx, wy });
    if (path.length > 0) {
      this.targetWx = path[0].wx;
      this.targetWy = path[0].wy;
      this.waypoints = path.slice(1);
    }
  }

  /** Immediate target override (no path planning) — only for dynamic tracking. */
  setTarget(wx: number, wy: number) {
    this.targetWx = wx;
    this.targetWy = wy;
    this.waypoints = [];
  }

  moveTowardTarget(dt: number) {
    const dx = this.targetWx - this.wx;
    const dy = this.targetWy - this.wy;
    const d = Math.hypot(dx, dy);

    if (d < 0.012) {
      this.wx = this.targetWx;
      this.wy = this.targetWy;

      if (this.waypoints.length > 0) {
        this.targetWx = this.waypoints[0].wx;
        this.targetWy = this.waypoints[0].wy;
        this.waypoints = this.waypoints.slice(1);
      } else {
        // Arrived at final destination
        if (
          this.state === WORKER_STATES.WORKING ||
          this.state === WORKER_STATES.DROWSY ||
          this.state === WORKER_STATES.SLEEPING
        ) {
          if (dist(this, { wx: this.desk.seatWx, wy: this.desk.seatWy }) < 0.03) {
            this.atDesk = true;
            this.wx = this.desk.seatWx;
            this.wy = this.desk.seatWy;
            this.facing = this.desk.seatWx < 0.5 ? 1 : -1;
          }
        }
      }
      return;
    }

    const speed = CONFIG.workerSpeed * dt;
    let newWx = this.wx + (dx / d) * speed;
    let newWy = this.wy + (dy / d) * speed;

    const finalDestWx = this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1].wx
      : this.targetWx;
    const finalDestWy = this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1].wy
      : this.targetWy;

    const pushed = pushOutOfObstacles(newWx, newWy, finalDestWx, finalDestWy);
    this.wx = pushed.wx;
    this.wy = pushed.wy;
    this.facing = dx >= 0 ? 1 : -1;
    this.atDesk = false;
  }

  private updateMission(dt: number, game: GameEngine) {
    const m = this.onMission!;
    if (m.type === 'walk') {
      if (!m.pathStarted) {
        this.startJourney(m.wx, m.wy);
        m.pathStarted = true;
      }
      this.moveTowardTarget(dt);
      if (dist(this, { wx: m.wx, wy: m.wy }) < 0.025) m.onArrive?.(this, game);
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
      this.atDesk = true;
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
  waypoints: ScenePoint[] = [];
  delayTimer = 0;
  facing = 1;
  anim = 0;
  /** Last sleepy-worker position used to plan the boss path */
  private pathTarget: ScenePoint = { wx: -1, wy: -1 };

  reset() {
    this.active = false;
    this.wx = SCENE_POI.bossDoor.wx;
    this.wy = SCENE_POI.bossDoor.wy + 0.02;
    this.delayTimer = 0;
    this.waypoints = [];
  }

  spawn() {
    this.active = true;
    this.wx = SCENE_POI.bossDoor.wx;
    this.wy = SCENE_POI.bossDoor.wy + 0.02;
    this.delayTimer = 0;
    this.waypoints = [];
    this.pathTarget = { wx: -1, wy: -1 };
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

    // Re-plan if the sleepy worker's position changed significantly
    const targetMoved =
      Math.hypot(sleepy.wx - this.pathTarget.wx, sleepy.wy - this.pathTarget.wy) > 0.06;

    if (this.waypoints.length === 0 || targetMoved) {
      const path = findPath({ wx: this.wx, wy: this.wy }, { wx: sleepy.wx, wy: sleepy.wy });
      if (path.length > 0) {
        this.targetWx = path[0].wx;
        this.targetWy = path[0].wy;
        this.waypoints = path.slice(1);
      }
      this.pathTarget = { wx: sleepy.wx, wy: sleepy.wy };
    }

    const dx = this.targetWx - this.wx;
    const dy = this.targetWy - this.wy;
    const d = Math.hypot(dx, dy);

    if (d < 0.04) {
      this.wx = this.targetWx;
      this.wy = this.targetWy;

      if (this.waypoints.length > 0) {
        this.targetWx = this.waypoints[0].wx;
        this.targetWy = this.waypoints[0].wy;
        this.waypoints = this.waypoints.slice(1);
      } else {
        // Reached the sleepy worker
        if (sleepy.state === WORKER_STATES.SLEEPING || sleepy.wakeMeter >= CONFIG.sleepThreshold) {
          game.lose('The boss caught someone sleeping on the job!');
        }
      }
      return;
    }

    const speed = game.bossSpeed * dt;
    let newWx = this.wx + (dx / d) * speed;
    let newWy = this.wy + (dy / d) * speed;

    // Push out of obstacles (allowed into desk where sleepy worker is sitting)
    const finalDestWx = this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1].wx
      : this.targetWx;
    const finalDestWy = this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1].wy
      : this.targetWy;
    const pushed = pushOutOfObstacles(newWx, newWy, finalDestWx, finalDestWy);
    this.wx = pushed.wx;
    this.wy = pushed.wy;
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
  | {
      type: 'walk';
      wx: number;
      wy: number;
      pathStarted?: boolean;
      action?: WakeAction;
      onArrive?: (w: Worker, g: GameEngine) => void;
    }
  | { type: 'distract'; timer: number; icon?: string };

function pickDuration(state: WorkerState) {
  switch (state) {
    case WORKER_STATES.WORKING: return 18 + Math.random() * 12;
    case WORKER_STATES.BREAK:   return 4  + Math.random() * 3;
    case WORKER_STATES.WALKING: return 3  + Math.random() * 2;
    case WORKER_STATES.CHATTING: return 6;
    default: return 5;
  }
}

export function createWorkers(profiles?: CharacterProfile[]) {
  return SCENE_DESKS.slice(0, 6).map((desk, i) => new Worker(i, desk, profiles?.[i]));
}
