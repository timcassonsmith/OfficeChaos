import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import type { BgLayout } from './sceneLayout';

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
