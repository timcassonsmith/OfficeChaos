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

/**
 * Draw a single sprite-sheet character.
 * cx/cy = screen position of the character's feet (bottom-centre).
 * flip = true → mirror horizontally (facing left).
 * scaleMul = extra size multiplier (use >1 for boss).
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
) {
  const destH = bg.drawH * 0.165 * scaleMul;
  const destW = (frame.w / frame.h) * destH;
  const sx = cx - destW / 2;
  const sy = cy - destH;

  const srcRect = Skia.XYWHRect(frame.x, frame.y, frame.w, frame.h);
  const dstRect = Skia.XYWHRect(sx, sy, destW, destH);

  canvas.save();
  if (flip) {
    // Mirror horizontally around cx: translate(2*cx,0) then scale(-1,1)
    canvas.translate(2 * cx, 0);
    canvas.scale(-1, 1);
  }
  canvas.drawImageRect(sheet, srcRect, dstRect, _charPaint, false);
  canvas.restore();
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
