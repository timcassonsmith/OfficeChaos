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
  { wx: 0.19, wy: 0.54, seatWx: 0.19, seatWy: 0.575 },
  { wx: 0.19, wy: 0.655, seatWx: 0.19, seatWy: 0.69 },
  { wx: 0.19, wy: 0.77, seatWx: 0.19, seatWy: 0.805 },
  { wx: 0.81, wy: 0.54, seatWx: 0.81, seatWy: 0.575 },
  { wx: 0.81, wy: 0.655, seatWx: 0.81, seatWy: 0.69 },
  { wx: 0.81, wy: 0.77, seatWx: 0.81, seatWy: 0.805 },
];

export const SCENE_POI = {
  coffee: { wx: 0.115, wy: 0.435 },
  cooler: { wx: 0.1, wy: 0.47 },
  vending: { wx: 0.085, wy: 0.405 },
  sofa: { wx: 0.885, wy: 0.435 },
  bossDoor: { wx: 0.5, wy: 0.355 },
  aisle: { wx: 0.5, wy: 0.62 },
};

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
