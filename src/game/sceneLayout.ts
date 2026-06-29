/** Normalized positions (0–1) on the office background image. */

export interface ScenePoint {
  wx: number;
  wy: number;
}

export interface SceneDesk extends ScenePoint {
  /** Where the character's feet sit in the chair */
  seatWx: number;
  seatWy: number;
}

/** Six cubicle seats aligned to office-bg.png (1024×896) */
export const SCENE_DESKS: SceneDesk[] = [
  { wx: 0.19, wy: 0.54,  seatWx: 0.19, seatWy: 0.575 },
  { wx: 0.19, wy: 0.655, seatWx: 0.19, seatWy: 0.69  },
  { wx: 0.19, wy: 0.77,  seatWx: 0.19, seatWy: 0.805 },
  { wx: 0.81, wy: 0.54,  seatWx: 0.81, seatWy: 0.575 },
  { wx: 0.81, wy: 0.655, seatWx: 0.81, seatWy: 0.69  },
  { wx: 0.81, wy: 0.77,  seatWx: 0.81, seatWy: 0.805 },
];

export const SCENE_POI = {
  coffee:   { wx: 0.115, wy: 0.435 },
  cooler:   { wx: 0.10,  wy: 0.47  },
  vending:  { wx: 0.085, wy: 0.405 },
  sofa:     { wx: 0.885, wy: 0.435 },
  bossDoor: { wx: 0.5,   wy: 0.355 },
  aisle:    { wx: 0.5,   wy: 0.62  },
};

// ---------------------------------------------------------------------------
// Obstacle system
// ---------------------------------------------------------------------------

export interface Obstacle {
  x1: number; y1: number; x2: number; y2: number;
}

/**
 * Approximate bounding rectangles for each desk cluster.
 * Characters must walk AROUND these, not through them.
 */
export const DESK_OBSTACLES: Obstacle[] = [
  // Left column (wx 0.06-0.29)
  { x1: 0.06, y1: 0.535, x2: 0.29, y2: 0.625 }, // row 1 (seat wy 0.575)
  { x1: 0.06, y1: 0.650, x2: 0.29, y2: 0.740 }, // row 2 (seat wy 0.69)
  { x1: 0.06, y1: 0.765, x2: 0.29, y2: 0.855 }, // row 3 (seat wy 0.805)
  // Right column (wx 0.71-0.94)
  { x1: 0.71, y1: 0.535, x2: 0.94, y2: 0.625 }, // row 1
  { x1: 0.71, y1: 0.650, x2: 0.94, y2: 0.740 }, // row 2
  { x1: 0.71, y1: 0.765, x2: 0.94, y2: 0.855 }, // row 3
];

/**
 * X boundaries of the centre aisle (between desk columns).
 * Any path that stays in wx [LEFT_AISLE..RIGHT_AISLE] is obstacle-free.
 */
const LEFT_AISLE  = 0.30;
const RIGHT_AISLE = 0.70;
/** wy above which the entire width is obstacle-free (the break-room / back-wall area) */
const DESK_TOP    = 0.53;

// ---------------------------------------------------------------------------
// Path planning
// ---------------------------------------------------------------------------

/**
 * Plan a walkable path from `from` to `to` routing through aisles to avoid
 * desk clusters.  Returns an array of waypoints including the final destination.
 */
export function findPath(from: ScenePoint, to: ScenePoint): ScenePoint[] {
  const wps: ScenePoint[] = [];

  const fL = from.wx < LEFT_AISLE;
  const fR = from.wx > RIGHT_AISLE;
  const tL = to.wx < LEFT_AISLE;
  const tR = to.wx > RIGHT_AISLE;
  const tAbove = to.wy < DESK_TOP; // destination is in the break-room zone above desks

  // 1. Exit current desk column into the centre aisle
  if (fL) wps.push({ wx: LEFT_AISLE,  wy: from.wy });
  else if (fR) wps.push({ wx: RIGHT_AISLE, wy: from.wy });

  // 2. When heading to a destination above the desk zone, clear the desk tops
  //    by going UP in the aisle before going sideways.
  if (tAbove) {
    const lastY = wps.length ? wps[wps.length - 1].wy : from.wy;
    if (lastY > DESK_TOP) {
      const clearX = tL ? LEFT_AISLE
                   : tR ? RIGHT_AISLE
                   : fL ? LEFT_AISLE
                   : fR ? RIGHT_AISLE
                   : 0.50;
      wps.push({ wx: clearX, wy: DESK_TOP - 0.02 });
    }
  }

  // 3. Enter the destination desk column from the aisle side (in-desk targets only)
  if (!tAbove) {
    if (tL) wps.push({ wx: LEFT_AISLE,  wy: to.wy });
    else if (tR) wps.push({ wx: RIGHT_AISLE, wy: to.wy });
  }

  wps.push(to);
  return wps;
}

// ---------------------------------------------------------------------------
// Collision resolution
// ---------------------------------------------------------------------------

/**
 * If (wx, wy) is inside any desk obstacle AND the character's final
 * destination is NOT also inside that obstacle (i.e. they are not heading
 * to sit at that desk), push the position to the nearest free edge.
 */
export function pushOutOfObstacles(
  wx: number, wy: number,
  destWx: number, destWy: number,
): { wx: number; wy: number } {
  for (const r of DESK_OBSTACLES) {
    if (wx <= r.x1 || wx >= r.x2 || wy <= r.y1 || wy >= r.y2) continue;
    // Allow being inside if the final destination is also in this obstacle
    if (destWx > r.x1 && destWx < r.x2 && destWy > r.y1 && destWy < r.y2) continue;
    // Push to nearest edge
    const dL = wx - r.x1, dR = r.x2 - wx, dT = wy - r.y1, dB = r.y2 - wy;
    const m = Math.min(dL, dR, dT, dB);
    if      (m === dL) wx = r.x1;
    else if (m === dR) wx = r.x2;
    else if (m === dT) wy = r.y1;
    else               wy = r.y2;
  }
  return { wx, wy };
}

// ---------------------------------------------------------------------------
// Background layout helpers
// ---------------------------------------------------------------------------

export interface BgLayout {
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
  imgW: number;
  imgH: number;
}

export function computeBgLayout(
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
): BgLayout {
  const scale = Math.min(canvasW / imgW, canvasH / imgH); // contain
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  return {
    offsetX: (canvasW - drawW) / 2,
    offsetY: (canvasH - drawH) / 2,
    drawW,
    drawH,
    imgW,
    imgH,
  };
}

export function normToScreen(wx: number, wy: number, bg: BgLayout) {
  return {
    x: bg.offsetX + wx * bg.drawW,
    y: bg.offsetY + wy * bg.drawH,
  };
}

export function screenToNorm(sx: number, sy: number, bg: BgLayout): ScenePoint {
  return {
    wx: (sx - bg.offsetX) / bg.drawW,
    wy: (sy - bg.offsetY) / bg.drawH,
  };
}

/** Character sprite height as fraction of background draw height */
export function characterHeight(bg: BgLayout, sitting: boolean) {
  return bg.drawH * (sitting ? 0.145 : 0.175);
}
