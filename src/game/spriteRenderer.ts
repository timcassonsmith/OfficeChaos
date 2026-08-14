import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import type { BgLayout } from './sceneLayout';
import type { SpriteFrame } from './spriteAtlas';

const _bgPaint = Skia.Paint();
const _skyPaint = Skia.Paint();
_skyPaint.setColor(Skia.Color('#87ceeb'));

/**
 * Draw background image using CONTAIN scaling (Math.min) so the full office
 * is always visible. Side margins are filled with sky blue.
 */
export function drawBackgroundImage(
  canvas: SkCanvas,
  image: SkImage,
  width: number,
  height: number,
): BgLayout | null {
  const iw = image.width();
  const ih = image.height();
  if (!iw || !ih || width <= 0 || height <= 0) return null;

  // contain: fit the whole image, letterbox/pillarbox if needed
  const scale = Math.min(width / iw, height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  // fill sky colour behind image (visible in pillarbox/letterbox areas)
  canvas.drawRect({ x: 0, y: 0, width, height }, _skyPaint);

  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, iw, ih),
    Skia.XYWHRect(dx, dy, dw, dh),
    _bgPaint,
    false,
  );

  return { offsetX: dx, offsetY: dy, drawW: dw, drawH: dh, imgW: iw, imgH: ih };
}

const _charPaint = Skia.Paint();

export type CharPose = 'stand' | 'sit' | 'sleep';

/**
 * Draw a single sprite-sheet character.
 * cx/cy = screen position of the character's feet (bottom-centre).
 * flip = true → mirror horizontally (facing left).
 * pose: sit = shorter seated figure; sleep = face-planted on desk.
 */
export function drawSpriteCharacter(
  canvas: SkCanvas,
  sheet: SkImage,
  frame: SpriteFrame,
  cx: number,
  cy: number,
  bg: BgLayout,
  flip: boolean,
  scaleMul: number = 1,
  pose: CharPose = 'stand',
) {
  const standH = bg.drawH * 0.165 * scaleMul;
  const sitH = standH * 0.72;
  const destH = pose === 'stand' ? standH : sitH;
  const destW = (frame.w / frame.h) * destH;
  const srcRect = Skia.XYWHRect(frame.x, frame.y, frame.w, frame.h);

  canvas.save();

  if (pose === 'sleep') {
    // Face-plant toward the desk (lean forward onto the surface)
    const lean = flip ? 1.05 : -1.05; // radians ≈ 60°
    const pivotX = cx;
    const pivotY = cy - destH * 0.35;
    canvas.translate(pivotX, pivotY);
    canvas.rotate((lean * 180) / Math.PI, 0, 0);
    if (flip) {
      canvas.scale(-1, 1);
    }
    canvas.drawImageRect(
      sheet,
      srcRect,
      Skia.XYWHRect(-destW / 2, -destH * 0.55, destW, destH * 0.85),
      _charPaint,
      false,
    );
  } else {
    const sx = cx - destW / 2;
    const sy = cy - destH;
    if (flip) {
      canvas.translate(2 * cx, 0);
      canvas.scale(-1, 1);
    }
    canvas.drawImageRect(sheet, srcRect, Skia.XYWHRect(sx, sy, destW, destH), _charPaint, false);
  }

  canvas.restore();
}

/** Floating Z / z / Z particles rising from a sleeping/drowsy worker's head */
export function drawSleepZzz(
  canvas: SkCanvas,
  cx: number,
  cy: number,
  bg: BgLayout,
  time: number,
  heavy: boolean,
) {
  const baseY = cy - bg.drawH * (heavy ? 0.10 : 0.14);
  const count = heavy ? 3 : 2;
  const fontSize = Math.max(10, bg.drawH * (heavy ? 0.028 : 0.022));

  for (let i = 0; i < count; i++) {
    const phase = time * (heavy ? 1.1 : 0.7) + i * 1.7;
    const t = (phase % 2.8) / 2.8;
    const rise = t * bg.drawH * 0.08;
    const sway = Math.sin(phase * 2.2) * bg.drawH * 0.012;
    const alpha = Math.max(0.15, 1 - t);
    const size = fontSize * (0.75 + i * 0.18);
    const x = cx + sway + (i - 1) * bg.drawH * 0.02;
    const y = baseY - rise;

    const p = Skia.Paint();
    p.setColor(Skia.Color('#2563eb'));
    p.setAlphaf(alpha);
    p.setStrokeWidth(Math.max(1.5, size * 0.18));
    p.setStyle(1); // stroke
    // Pixel-style "Z"
    canvas.drawLine(x - size * 0.35, y - size * 0.4, x + size * 0.35, y - size * 0.4, p);
    canvas.drawLine(x + size * 0.35, y - size * 0.4, x - size * 0.35, y + size * 0.4, p);
    canvas.drawLine(x - size * 0.35, y + size * 0.4, x + size * 0.35, y + size * 0.4, p);
  }
}

export function drawSelectionRing(
  canvas: SkCanvas,
  wx: number,
  wy: number,
  bg: BgLayout,
  color: string,
) {
  const x = bg.offsetX + wx * bg.drawW;
  const y = bg.offsetY + wy * bg.drawH;
  const r = Math.max(6, bg.drawH * 0.03);
  const p = Skia.Paint();
  p.setColor(Skia.Color(color));
  p.setStyle(1);
  p.setStrokeWidth(Math.max(2, bg.drawH * 0.005));
  canvas.drawCircle(x, y - r * 1.4, r, p);
}
