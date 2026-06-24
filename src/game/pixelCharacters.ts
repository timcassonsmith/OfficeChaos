import type { SkCanvas } from '@shopify/react-native-skia';
import { WORKER_STATES, getGameScale, setGameScale } from './constants';
import type { Worker, Boss } from './entities';
import type { CharacterProfile } from './profiles';
import type { BgLayout } from './sceneLayout';
import { normToScreen } from './sceneLayout';
import { skPaint, strokePaint } from './sprites';

function px(v: number) {
  return v * getGameScale();
}

function block(canvas: SkCanvas, x: number, y: number, w: number, h: number, color: string) {
  const rw = Math.max(1, Math.round(w));
  const rh = Math.max(1, Math.round(h));
  canvas.drawRect({ x: Math.round(x), y: Math.round(y), width: rw, height: rh }, skPaint(color));
  canvas.drawRect({ x: Math.round(x), y: Math.round(y), width: rw, height: rh }, strokePaint('#1a1a2e', Math.max(0.5, px(0.6))));
}

/** Compute a good character scale so chars are ~13% of the visible canvas height. */
function scaleForBg(bg: BgLayout) {
  // 68 px is the approx height of a procedural character at scale=1
  return Math.max(0.45, Math.min(1.8, bg.drawH * 0.13 / 68));
}

/** Draw a character at normalised (wx, wy) position over the background. */
export function drawCharacterAtPos(
  canvas: SkCanvas,
  w: Worker,
  bg: BgLayout,
  time: number,
) {
  const saved = getGameScale();
  setGameScale(scaleForBg(bg));
  const { x: cx, y: cy } = normToScreen(w.wx, w.wy, bg);
  drawPixelCharacter(canvas, w, cx, cy, time);
  setGameScale(saved);
}

export function drawBossAtPos(
  canvas: SkCanvas,
  boss: Boss,
  bg: BgLayout,
  time: number,
) {
  const saved = getGameScale();
  setGameScale(scaleForBg(bg));
  const { x: cx, y: cy } = normToScreen(boss.wx, boss.wy, bg);
  drawPixelBoss(canvas, boss, cx, cy, time);
  setGameScale(saved);
}

/** Chibi pixel character inspired by reference sprite sheet */
export function drawPixelCharacter(canvas: SkCanvas, w: Worker, cx: number, cy: number, time: number) {
  const u = px(4);
  const walking =
    w.state === WORKER_STATES.WALKING ||
    w.onMission?.type === 'walk' ||
    (w.state === WORKER_STATES.BREAK && !w.atDesk);
  const sitting =
    (w.state === WORKER_STATES.WORKING ||
      w.state === WORKER_STATES.DROWSY ||
      w.state === WORKER_STATES.SLEEPING) &&
    (w.atDesk || w.isSleepyTarget) &&
    !walking;
  const sleeping = w.state === WORKER_STATES.SLEEPING;
  const drowsy = w.state === WORKER_STATES.DROWSY;
  const legPhase = walking ? Math.sin(w.anim * 12) : 0;
  const bob = walking ? Math.abs(Math.sin(w.anim * 12)) * u * 0.6 : 0;
  const y = cy - bob;
  const dir = w.facing >= 0 ? 1 : -1;

  // shadow
  canvas.drawOval({ x: cx - px(14), y: y + u * 2, width: px(28), height: u * 2 }, skPaint('#000', 0.18));

  if (w.selected) drawPixelPlumbob(canvas, cx, y - u * 14, time, '#22c55e');
  if (w.isSleepyTarget) drawPixelPlumbob(canvas, cx, y - u * 14, time, '#ef4444');

  if (sitting) {
    drawPixelChair(canvas, cx, y + u * 2);
    drawPixelLegs(canvas, cx, y + u * 3, w, false, 0, true);
    drawPixelTorso(canvas, cx, y - u * 2, w, true);
    const nod = drowsy ? Math.sin(time * 3) * u : sleeping ? u * 2.5 : Math.sin(w.typingPhase * 6) * u * 0.2;
    drawPixelHead(canvas, cx, y - u * 8 + nod, w.hairColor, w.skinColor, w.sex, sleeping, drowsy);
    if (w.state === WORKER_STATES.WORKING && !sleeping && !drowsy) {
      const hand = Math.sin(w.typingPhase * 10) > 0 ? u * 0.5 : 0;
      block(canvas, cx + u * 3 * dir, y - u + hand, u * 1.5, u, w.skinColor);
    }
  } else {
    drawPixelLegs(canvas, cx, y, w, true, legPhase, false);
    drawPixelTorso(canvas, cx, y - u * 4, w, false);
    drawPixelHead(canvas, cx, y - u * 10, w.hairColor, w.skinColor, w.sex, sleeping, drowsy);
    if (walking) {
      block(canvas, cx - u * 4 * dir + legPhase * u, y - u * 3, u * 1.5, u * 2, w.outfitColor);
      block(canvas, cx + u * 2 * dir - legPhase * u, y - u * 3, u * 1.5, u * 2, w.outfitColor);
    }
  }
}

export function drawPixelBoss(canvas: SkCanvas, boss: Boss, cx: number, cy: number, time: number) {
  const u = px(4);
  const walking = boss.active && boss.delayTimer <= 0;
  const legPhase = walking ? Math.sin(boss.anim * 11) : 0;
  const y = cy - (walking ? Math.abs(Math.sin(boss.anim * 11)) * u * 0.5 : 0);

  if (boss.active) drawPixelPlumbob(canvas, cx, y - u * 15, time, '#ef4444');

  canvas.drawOval({ x: cx - px(18), y: y + u * 2, width: px(36), height: px(10) }, skPaint('#000', 0.22));

  if (!walking) {
    drawPixelChair(canvas, cx, y + u * 2);
    block(canvas, cx - u * 2, y + u * 2, u * 4, u * 3, '#1a1a1a');
    block(canvas, cx - u, y + u * 5, u * 2, u * 2, '#1a1a1a');
  } else {
    block(canvas, cx - u * 2 + legPhase * u * 0.5, y, u * 2, u * 4, '#1a1a1a');
    block(canvas, cx + legPhase * u * 0.5, y, u * 2, u * 4, '#1a1a1a');
  }
  block(canvas, cx - u * 3, y - u * 4, u * 6, u * 5, '#1e293b');
  block(canvas, cx - u, y - u * 3, u * 2, u * 4, '#f1f5f9');
  block(canvas, cx - u * 0.5, y - u * 2, u, u * 3, '#dc2626');
  drawPixelHead(canvas, cx, y - u * 9, '#374151', '#ffdbac', 'male', false, false);
}

function drawPixelHead(
  canvas: SkCanvas,
  cx: number,
  cy: number,
  hairColor: string,
  skinColor: string,
  sex: 'male' | 'female',
  sleeping: boolean,
  drowsy: boolean,
) {
  const u = px(4);
  if (sex === 'female') {
    block(canvas, cx - u * 4, cy - u * 2, u * 8, u * 3, hairColor);
    block(canvas, cx - u * 5, cy, u * 2, u * 5, hairColor);
    block(canvas, cx + u * 3, cy, u * 2, u * 5, hairColor);
    block(canvas, cx - u * 3.5, cy - u, u * 7, u * 4, hairColor);
  } else {
    block(canvas, cx - u * 3.5, cy - u * 2, u * 7, u * 2.5, hairColor);
    block(canvas, cx - u * 3, cy - u, u * 6, u * 1.5, hairColor);
  }
  block(canvas, cx - u * 3, cy, u * 6, u * 5, skinColor);

  if (sleeping) {
    canvas.drawLine(cx - u * 2, cy + u * 2, cx - u * 0.5, cy + u * 2, strokePaint('#1a1a2e', px(1.2)));
    canvas.drawLine(cx + u * 0.5, cy + u * 2, cx + u * 2, cy + u * 2, strokePaint('#1a1a2e', px(1.2)));
  } else if (drowsy) {
    block(canvas, cx - u * 2, cy + u * 1.5, u * 1.5, u * 0.5, '#1a1a2e');
    block(canvas, cx + u * 0.5, cy + u * 1.5, u * 1.5, u * 0.5, '#1a1a2e');
  } else {
    block(canvas, cx - u * 2, cy + u, u * 1.2, u * 1.5, '#1a1a2e');
    block(canvas, cx + u * 0.8, cy + u, u * 1.2, u * 1.5, '#1a1a2e');
    block(canvas, cx - u * 1.8, cy + u * 1.1, u * 0.4, u * 0.4, '#fff');
    block(canvas, cx + u, cy + u * 1.1, u * 0.4, u * 0.4, '#fff');
  }
}

function drawPixelTorso(canvas: SkCanvas, cx: number, cy: number, w: Worker, sitting: boolean) {
  const u = px(4);
  const h = sitting ? u * 4 : u * 5;
  block(canvas, cx - u * 3, cy, u * 6, h, w.outfitColor);
  if (w.sex === 'female') {
    block(canvas, cx - u * 3.5, cy + h - u, u * 7, u * 2, w.outfitColor);
    block(canvas, cx - u * 3, cy + h + u, u * 6, u * 2, w.pantsColor);
  }
}

function drawPixelLegs(
  canvas: SkCanvas,
  cx: number,
  cy: number,
  w: Worker,
  standing: boolean,
  legPhase: number,
  sitting: boolean,
) {
  const u = px(4);
  if (sitting) {
    block(canvas, cx - u * 2.5, cy, u * 2, u * 2, w.pantsColor);
    block(canvas, cx + u * 0.5, cy, u * 2, u * 2, w.pantsColor);
    return;
  }
  if (w.sex === 'female' && standing) {
    block(canvas, cx - u * 2 + legPhase * u, cy, u * 1.8, u * 4, w.pantsColor);
    block(canvas, cx + u * 0.2 - legPhase * u, cy, u * 1.8, u * 4, w.pantsColor);
    block(canvas, cx - u * 2 + legPhase * u, cy + u * 4, u * 2, u * 1.2, '#1a1a1a');
    block(canvas, cx + u * 0.2 - legPhase * u, cy + u * 4, u * 2, u * 1.2, '#1a1a1a');
  } else if (standing) {
    block(canvas, cx - u * 2 + legPhase * u, cy, u * 2, u * 4.5, w.pantsColor);
    block(canvas, cx + legPhase * u, cy, u * 2, u * 4.5, w.pantsColor);
    block(canvas, cx - u * 2 + legPhase * u, cy + u * 4.5, u * 2.2, u * 1.2, '#1a1a1a');
    block(canvas, cx + legPhase * u, cy + u * 4.5, u * 2.2, u * 1.2, '#1a1a1a');
  }
}

function drawPixelChair(canvas: SkCanvas, cx: number, cy: number) {
  const u = px(4);
  block(canvas, cx - u * 3, cy, u * 6, u * 2, '#636e72');
  block(canvas, cx - u * 2.5, cy - u * 2, u * 5, u * 2.5, '#636e72');
  block(canvas, cx - u * 0.5, cy + u * 2, u, u * 1.5, '#2d3436');
}

function drawPixelPlumbob(canvas: SkCanvas, x: number, y: number, time: number, color: string) {
  const u = px(4);
  const bounce = Math.sin(time * 4) * u * 0.3;
  block(canvas, x - u, y + bounce - u * 3, u * 2, u * 2, color);
  block(canvas, x - u * 0.5, y + bounce - u, u, u * 2, color);
}

/** Draw a character preview for the character setup screen */
export function drawProfilePreview(
  canvas: SkCanvas,
  profile: CharacterProfile,
  cx: number,
  cy: number,
  time: number,
) {
  const saved = getGameScale();
  setGameScale(1.4);
  const u = px(4);
  const stub = {
    sex: profile.sex,
    hairColor: profile.hairColor,
    skinColor: profile.skinColor,
    outfitColor: profile.outfitColor,
    pantsColor: profile.pantsColor,
    typingPhase: time,
    anim: time,
    facing: 1,
    onMission: null,
    atDesk: false,
    isSleepyTarget: false,
    selected: false,
    state: WORKER_STATES.WORKING,
  } as unknown as Worker;
  const y = cy + u;
  drawPixelLegs(canvas, cx, y, stub, true, Math.sin(time * 2) * 0.2, false);
  drawPixelTorso(canvas, cx, y - u * 4, stub, false);
  drawPixelHead(canvas, cx, y - u * 10, profile.hairColor, profile.skinColor, profile.sex, false, false);
  setGameScale(saved);
}
