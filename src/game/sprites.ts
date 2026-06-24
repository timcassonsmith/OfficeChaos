import { SkCanvas, Skia } from '@shopify/react-native-skia';
import { COLORS, TILE_H, TILE_W, WALL_H, WORKER_STATES, getGameScale, isoToScreen, lerp } from './constants';
import type { Boss, Effect, Worker } from './entities';
import type { OfficeTile } from './officeMap';

const paints = new Map<string, ReturnType<typeof Skia.Paint>>();

export function skPaint(color: string, alpha = 1) {
  const key = `${color}-${alpha}`;
  if (!paints.has(key)) {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setAlphaf(alpha);
    paints.set(key, p);
  }
  return paints.get(key)!;
}

export function strokePaint(color: string, width = 1.5) {
  const p = Skia.Paint();
  p.setColor(Skia.Color(color));
  p.setStyle(1);
  p.setStrokeWidth(width);
  return p;
}

function s(v: number) {
  return v * getGameScale();
}

function diamond(sx: number, sy: number, hw: number, hh: number) {
  const path = Skia.Path.Make();
  path.moveTo(sx, sy);
  path.lineTo(sx + hw, sy + hh);
  path.lineTo(sx, sy + hh * 2);
  path.lineTo(sx - hw, sy + hh);
  path.close();
  return path;
}

export function drawFloorTile(
  canvas: SkCanvas,
  sx: number,
  sy: number,
  tile: OfficeTile,
  gx: number,
  gy: number,
) {
  const hw = s(TILE_W / 2);
  const hh = s(TILE_H / 2);
  let a: string;
  let b: string;
  if (tile.type === 'boss_floor') {
    a = COLORS.bossCarpetA;
    b = COLORS.bossCarpetB;
  } else if (tile.type === 'main_floor') {
    a = COLORS.floorTileA;
    b = COLORS.floorTileB;
  } else {
    a = COLORS.floorPlank;
    b = COLORS.floorPlankDark;
  }
  canvas.drawPath(diamond(sx, sy, hw, hh), skPaint((gx + gy) % 2 === 0 ? a : b));
  if (tile.type === 'main_floor' || tile.type === 'hall_floor') {
    for (let i = -hw; i < hw; i += s(6)) {
      canvas.drawLine(sx + i, sy + hh * 0.5, sx + i + hw, sy + hh * 1.5, strokePaint('rgba(255,255,255,0.15)', 0.6));
    }
  }
}

export function drawWall(canvas: SkCanvas, sx: number, sy: number, tile: OfficeTile) {
  const hw = s(TILE_W / 2);
  const hh = s(TILE_H / 2);
  const wh = s(WALL_H);
  const sides = tile.sides ?? {};
  if (sides.north) {
    const path = Skia.Path.Make();
    path.moveTo(sx - hw, sy - hh);
    path.lineTo(sx + hw, sy - hh);
    path.lineTo(sx + hw, sy - hh - wh);
    path.lineTo(sx - hw, sy - hh - wh);
    path.close();
    canvas.drawPath(path, skPaint(COLORS.wallFace));
    canvas.drawRect({ x: sx - hw, y: sy - hh - wh, width: hw * 2, height: s(5) }, skPaint(COLORS.wallTop));
    for (let i = -hw + s(8); i < hw; i += s(10)) {
      canvas.drawLine(sx + i, sy - hh - s(6), sx + i, sy - hh - wh + s(6), strokePaint(COLORS.wallStripe, 1));
    }
  }
  if (sides.west) {
    const path = Skia.Path.Make();
    path.moveTo(sx - hw, sy);
    path.lineTo(sx, sy + hh);
    path.lineTo(sx, sy + hh - wh);
    path.lineTo(sx - hw, sy - wh);
    path.close();
    canvas.drawPath(path, skPaint('#e2e8f0'));
  }
  if (sides.east) {
    const path = Skia.Path.Make();
    path.moveTo(sx + hw, sy);
    path.lineTo(sx, sy + hh);
    path.lineTo(sx, sy + hh - wh);
    path.lineTo(sx + hw, sy - wh);
    path.close();
    canvas.drawPath(path, skPaint('#dde4ea'));
  }
}

export function drawCubicleDesk(canvas: SkCanvas, sx: number, sy: number, deskId = 0) {
  canvas.drawRect({ x: sx - s(26), y: sy + s(2), width: s(52), height: s(16) }, skPaint(COLORS.desk));
  canvas.drawRect({ x: sx - s(24), y: sy - s(2), width: s(48), height: s(7) }, skPaint(COLORS.deskTop));
  canvas.drawRect({ x: sx - s(14), y: sy - s(26), width: s(28), height: s(22) }, skPaint(COLORS.monitorBezel));
  canvas.drawRect({ x: sx - s(12), y: sy - s(24), width: s(24), height: s(16) }, skPaint(COLORS.screen));
  canvas.drawRect({ x: sx - s(8), y: sy - s(20), width: s(10), height: s(8) }, skPaint(COLORS.screenGlow, 0.5));
  canvas.drawRect({ x: sx - s(10), y: sy + s(4), width: s(20), height: s(5) }, skPaint('#cbd5e1'));
  canvas.drawRect({ x: sx - s(8), y: sy + s(6), width: s(16), height: s(3) }, skPaint('#94a3b8'));
  const flagColors = ['#ef4444', '#3b82f6', '#22c55e'];
  canvas.drawRect({ x: sx + s(10), y: sy - s(18), width: s(8), height: s(6) }, skPaint(flagColors[deskId % 3]));
  canvas.drawRect({ x: sx - s(18), y: sy - s(10), width: s(6), height: s(6) }, skPaint('#fef08a'));
  canvas.drawRect({ x: sx - s(28), y: sy - s(8), width: s(4), height: s(28) }, skPaint(COLORS.partition));
  canvas.drawRect({ x: sx + s(24), y: sy - s(8), width: s(4), height: s(28) }, skPaint(COLORS.partition));
}

export function drawOfficeChair(canvas: SkCanvas, sx: number, sy: number) {
  canvas.drawRect({ x: sx - s(12), y: sy + s(4), width: s(24), height: s(12) }, skPaint(COLORS.chair));
  canvas.drawRect({ x: sx - s(10), y: sy - s(6), width: s(20), height: s(12) }, skPaint(COLORS.chair));
  canvas.drawRect({ x: sx - s(3), y: sy + s(14), width: s(6), height: s(4) }, skPaint('#334155'));
  canvas.drawRect({ x: sx - s(14), y: sy + s(16), width: s(5), height: s(3) }, skPaint('#334155'));
  canvas.drawRect({ x: sx + s(9), y: sy + s(16), width: s(5), height: s(3) }, skPaint('#334155'));
}

export function drawCharacter(
  canvas: SkCanvas,
  w: Worker,
  x: number,
  y: number,
  time: number,
) {
  const walking =
    w.state === WORKER_STATES.WALKING ||
    w.onMission?.type === 'walk' ||
    (w.state === WORKER_STATES.BREAK && !w.atDesk);
  const sitting =
    (w.state === WORKER_STATES.WORKING || w.state === WORKER_STATES.DROWSY || w.state === WORKER_STATES.SLEEPING) &&
    (w.atDesk || w.isSleepyTarget) &&
    !walking;
  const sleeping = w.state === WORKER_STATES.SLEEPING;
  const drowsy = w.state === WORKER_STATES.DROWSY;
  const legPhase = walking ? Math.sin(w.anim * 12) : 0;
  const bob = walking ? Math.abs(Math.sin(w.anim * 12)) * s(2.5) : 0;
  const py = y - bob;
  const typing = w.state === WORKER_STATES.WORKING && sitting && !sleeping && !drowsy;

  canvas.drawOval({ x: x - s(16), y: py + s(6), width: s(32), height: s(12) }, skPaint('#000', 0.22));

  if (w.selected) drawPlumbob(canvas, x, py - s(54), time, '#22c55e');
  if (w.isSleepyTarget) drawPlumbob(canvas, x, py - s(54), time, '#ef4444');

  if (sitting) {
    drawOfficeChair(canvas, x, py + s(2));
    drawLeg(canvas, x - s(8), py + s(10), w.pantsColor);
    drawLeg(canvas, x + s(2), py + s(10), w.pantsColor);
    canvas.drawRect({ x: x - s(11), y: py - s(16), width: s(22), height: s(18) }, skPaint(w.shirtColor));
    const handY = typing && Math.sin(w.typingPhase * 10) > 0 ? s(2) : 0;
    canvas.drawRect({ x: x - s(13), y: py - s(6) + handY, width: s(8), height: s(5) }, skPaint(COLORS.skin));
    canvas.drawRect({ x: x + s(5), y: py - s(6) - handY, width: s(8), height: s(5) }, skPaint(COLORS.skin));
    const nod = drowsy ? Math.sin(time * 3) * s(4) : sleeping ? s(10) : Math.sin(w.typingPhase * 6) * s(0.8);
    drawHead(canvas, x, py - s(28) + nod, w.hairColor, sleeping, drowsy);
    if (typing) {
      canvas.drawRect({ x: x + s(6), y: py - s(10), width: s(5), height: s(3) }, skPaint('#64748b'));
    }
  } else {
    drawLeg(canvas, x - s(6) + legPhase * s(5), py + s(2), w.pantsColor);
    drawLeg(canvas, x + s(6) - legPhase * s(5), py + s(2), w.pantsColor);
    drawShoe(canvas, x - s(6) + legPhase * s(5), py + s(16));
    drawShoe(canvas, x + s(6) - legPhase * s(5), py + s(16));
    canvas.drawRect({ x: x - s(11), y: py - s(2), width: s(22), height: s(16) }, skPaint(w.shirtColor));
    canvas.drawRect({ x: x - s(9), y: py + s(6), width: s(18), height: s(3) }, skPaint('#475569'));
    drawArm(canvas, x - s(13), py + s(2), legPhase * 0.3, w.shirtColor);
    drawArm(canvas, x + s(13), py + s(2), -legPhase * 0.3, w.shirtColor);
    drawHead(canvas, x, py - s(24), w.hairColor, sleeping, drowsy);
  }
}

export function drawBossCharacter(canvas: SkCanvas, boss: Boss, x: number, y: number, time: number) {
  const walking = boss.active && boss.delayTimer <= 0;
  const legPhase = walking ? Math.sin(boss.anim * 11) : 0;
  const py = y - (walking ? Math.abs(Math.sin(boss.anim * 11)) * 2 : 0);

  if (boss.active) drawPlumbob(canvas, x, py - 58, time, '#ef4444');

  canvas.drawOval({ x: x - 18, y: py + 6, width: 36, height: 14 }, skPaint('#000', 0.28));

  if (!boss.active) {
    drawOfficeChair(canvas, x, py + 2);
    drawLeg(canvas, x - 8, py + 10, COLORS.bossSuit);
    drawLeg(canvas, x + 2, py + 10, COLORS.bossSuit);
  } else {
    drawLeg(canvas, x - 6 + legPhase * 4, py + 2, COLORS.bossSuit);
    drawLeg(canvas, x + 6 - legPhase * 4, py + 2, COLORS.bossSuit);
    drawShoe(canvas, x - 6 + legPhase * 4, py + 16, '#111');
    drawShoe(canvas, x + 6 - legPhase * 4, py + 16, '#111');
  }

  canvas.drawRect({ x: x - 12, y: py - 8, width: 24, height: 18 }, skPaint(COLORS.bossSuit));
  canvas.drawRect({ x: x - 3, y: py - 6, width: 6, height: 14 }, skPaint(COLORS.bossShirt));
  const tie = Skia.Path.Make();
  tie.moveTo(x, py - 4);
  tie.lineTo(x - 4, py + 8);
  tie.lineTo(x + 4, py + 8);
  tie.close();
  canvas.drawPath(tie, skPaint('#dc2626'));
  drawHead(canvas, x, py - 22, '#374151', false, false, true);
}

function drawPlumbob(canvas: SkCanvas, x: number, y: number, time: number, color: string) {
  const s = 1 + Math.sin(time * 4) * 0.1;
  const path = Skia.Path.Make();
  path.moveTo(x, y - 12 * s);
  path.lineTo(x + 8 * s, y);
  path.lineTo(x, y + 12 * s);
  path.lineTo(x - 8 * s, y);
  path.close();
  canvas.drawPath(path, skPaint(color));
  canvas.drawPath(path, strokePaint('#fff', 1.5));
}

function drawLeg(canvas: SkCanvas, ox: number, oy: number, color: string) {
  canvas.drawRect({ x: ox - s(5), y: oy, width: s(10), height: s(16) }, skPaint(color));
  canvas.drawRect({ x: ox - s(5), y: oy, width: s(2), height: s(16) }, skPaint('#000', 0.12));
}

function drawShoe(canvas: SkCanvas, ox: number, oy: number, color = '#334155') {
  canvas.drawRect({ x: ox - s(6), y: oy, width: s(12), height: s(6) }, skPaint(color));
}

function drawArm(canvas: SkCanvas, ox: number, oy: number, angle: number, color: string) {
  canvas.drawRect({ x: ox - s(3), y: oy + angle * s(8), width: s(6), height: s(14) }, skPaint(color));
  canvas.drawCircle(ox, oy + s(14) + angle * s(8), s(4), skPaint(COLORS.skin));
}

function drawHead(
  canvas: SkCanvas,
  ox: number,
  oy: number,
  hairColor: string,
  sleeping: boolean,
  drowsy: boolean,
  angry = false,
) {
  const r = s(13);
  canvas.drawRect({ x: ox - s(3), y: oy + s(10), width: s(6), height: s(7) }, skPaint(COLORS.skin));
  canvas.drawCircle(ox, oy, r, skPaint(COLORS.skin));
  canvas.drawCircle(ox, oy, r, strokePaint(COLORS.outline, s(1.2)));
  canvas.drawOval({ x: ox - s(14), y: oy - s(18), width: s(28), height: s(16) }, skPaint(hairColor));

  if (sleeping) {
    canvas.drawLine(ox - s(6), oy + s(1), ox - s(2), oy + s(1), strokePaint(COLORS.outline, s(2)));
    canvas.drawLine(ox + s(2), oy + s(1), ox + s(6), oy + s(1), strokePaint(COLORS.outline, s(2)));
  } else if (drowsy) {
    canvas.drawRect({ x: ox - s(6), y: oy, width: s(5), height: s(2) }, skPaint(COLORS.outline));
    canvas.drawRect({ x: ox + s(1), y: oy, width: s(5), height: s(2) }, skPaint(COLORS.outline));
  } else if (angry) {
    canvas.drawRect({ x: ox - s(6), y: oy - s(1), width: s(5), height: s(4) }, skPaint(COLORS.outline));
    canvas.drawRect({ x: ox + s(1), y: oy - s(1), width: s(5), height: s(4) }, skPaint(COLORS.outline));
  } else {
    canvas.drawRect({ x: ox - s(6), y: oy - s(2), width: s(5), height: s(5) }, skPaint(COLORS.outline));
    canvas.drawRect({ x: ox + s(1), y: oy - s(2), width: s(5), height: s(5) }, skPaint(COLORS.outline));
    canvas.drawRect({ x: ox - s(5), y: oy - s(2), width: s(2), height: s(2) }, skPaint('#fff'));
    canvas.drawRect({ x: ox + s(2), y: oy - s(2), width: s(2), height: s(2) }, skPaint('#fff'));
  }
}

export function drawProp(canvas: SkCanvas, sx: number, sy: number, tile: OfficeTile, time: number) {
  switch (tile.type) {
    case 'desk':
      drawCubicleDesk(canvas, sx, sy - 6, tile.deskId);
      break;
    case 'boss_desk':
      canvas.drawRect({ x: sx - 30, y: sy, width: 60, height: 18 }, skPaint('#5c4033'));
      drawCubicleDesk(canvas, sx, sy - 8, 0);
      break;
    case 'boss_chair':
      drawOfficeChair(canvas, sx, sy);
      break;
    case 'partition':
      canvas.drawRect({ x: sx - 24, y: sy - 28, width: 48, height: 24 }, skPaint(COLORS.partition));
      canvas.drawRect({ x: sx - 24, y: sy - 30, width: 48, height: 4 }, skPaint(COLORS.partitionTop));
      break;
    case 'window':
      canvas.drawRect({ x: sx - 22, y: sy - 32, width: 44, height: 32 }, skPaint('#1e40af'));
      canvas.drawRect({ x: sx - 18, y: sy - 28, width: 36, height: 24 }, skPaint('#93c5fd'));
      canvas.drawLine(sx, sy - 28, sx, sy - 4, strokePaint('#fff', 2));
      canvas.drawLine(sx - 18, sy - 16, sx + 18, sy - 16, strokePaint('#fff', 2));
      break;
    case 'vending':
      canvas.drawRect({ x: sx - 16, y: sy - 44, width: 32, height: 46 }, skPaint(COLORS.vending));
      ['#ef4444', '#22c55e', '#eab308', '#3b82f6'].forEach((c, i) => {
        canvas.drawRect({ x: sx - 12, y: sy - 40 + i * 9, width: 24, height: 6 }, skPaint(c));
      });
      break;
    case 'cooler':
      canvas.drawRect({ x: sx - 12, y: sy - 34, width: 24, height: 36 }, skPaint('#e2e8f0'));
      canvas.drawRect({ x: sx - 8, y: sy - 26, width: 16, height: 16 }, skPaint('#38bdf8'));
      break;
    case 'coffee':
      canvas.drawRect({ x: sx - 20, y: sy - 2, width: 40, height: 14 }, skPaint(COLORS.coffee));
      canvas.drawRect({ x: sx - 8, y: sy - 22, width: 16, height: 18 }, skPaint('#57534e'));
      break;
    case 'sofa':
      canvas.drawRect({ x: sx - 28, y: sy - 10, width: 56, height: 20 }, skPaint(COLORS.sofa));
      canvas.drawRect({ x: sx - 28, y: sy - 22, width: 10, height: 14 }, skPaint('#ea580c'));
      canvas.drawRect({ x: sx + 18, y: sy - 22, width: 10, height: 14 }, skPaint('#ea580c'));
      break;
    case 'bookshelf':
      canvas.drawRect({ x: sx - 16, y: sy - 50, width: 32, height: 52 }, skPaint('#6f4e37'));
      ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'].forEach((c, i) => {
        canvas.drawRect({ x: sx - 14, y: sy - 46 + i * 9, width: 28, height: 7 }, skPaint(c));
      });
      break;
    case 'plant': {
      const bob = Math.sin(time * 1.5 + sx) * 1.2;
      canvas.drawRect({ x: sx - 10, y: sy + 2, width: 20, height: 14 }, skPaint(COLORS.pot));
      canvas.drawCircle(sx, sy + bob, 16, skPaint(COLORS.plant));
      canvas.drawCircle(sx - 8, sy - 8 + bob, 10, skPaint(COLORS.plantDark));
      canvas.drawCircle(sx + 8, sy - 8 + bob, 10, skPaint(COLORS.plantDark));
      break;
    }
    case 'filing':
      canvas.drawRect({ x: sx - 14, y: sy - 40, width: 28, height: 42 }, skPaint('#94a3b8'));
      break;
    case 'printer':
      canvas.drawRect({ x: sx - 16, y: sy - 14, width: 32, height: 16 }, skPaint('#e2e8f0'));
      canvas.drawRect({ x: sx - 12, y: sy - 22, width: 24, height: 10 }, skPaint('#64748b'));
      break;
    default:
      break;
  }
}

export function drawSky(canvas: SkCanvas, width: number, originY: number, time: number) {
  canvas.drawRect({ x: 0, y: 0, width, height: originY + 20 }, skPaint('#5bb5e8'));
  for (let i = 0; i < 4; i++) {
    const cx = (width * (0.15 + i * 0.22) + Math.sin(time * 0.2 + i) * 12) | 0;
    const cy = 24 + (i % 2) * 12;
    canvas.drawCircle(cx, cy, 28, skPaint('rgba(255,255,255,0.85)'));
    canvas.drawCircle(cx + 20, cy + 4, 18, skPaint('rgba(255,255,255,0.75)'));
  }
}

export function drawEffect(
  canvas: SkCanvas,
  e: Effect,
  from: { x: number; y: number },
  to: { x: number; y: number },
  p: number,
) {
  if (e.type === 'paper') {
    const x = lerp(from.x, to.x, p);
    const y = lerp(from.y - 28, to.y - 28, p) - Math.sin(p * Math.PI) * 40;
    canvas.drawRect({ x: x - 7, y: y - 6, width: 14, height: 12 }, skPaint('#fff'));
    canvas.drawRect({ x: x - 7, y: y - 6, width: 14, height: 12 }, strokePaint('#94a3b8', 1));
  } else {
    const x = lerp(from.x, to.x, p * 0.5 + 0.25);
    const y = lerp(from.y - 40, to.y - 40, p * 0.5 + 0.25);
    canvas.drawCircle(x, y, 12, skPaint('#ffd166', 0.9));
  }
}

export function drawRoomSign(canvas: SkCanvas, pos: { x: number; y: number }, label: string, color: string) {
  canvas.drawRect({ x: pos.x - 44, y: pos.y - 62, width: 88, height: 16 }, skPaint(color, 0.85));
  canvas.drawRect({ x: pos.x - 44, y: pos.y - 62, width: 88, height: 16 }, strokePaint('#000', 1));
}

export { isoToScreen };
