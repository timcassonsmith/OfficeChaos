import type { SkCanvas } from '@shopify/react-native-skia';
import { WORKER_STATES } from './constants';
import type { GameEngine } from './GameEngine';
import type { Boss, Worker } from './entities';
import { normToScreen } from './sceneLayout';
import { drawBackgroundImage } from './spriteRenderer';
import { drawCharacterAtPos, drawBossAtPos } from './pixelCharacters';
import { drawEffect } from './sprites';
import { Skia } from '@shopify/react-native-skia';

export function drawScene(canvas: SkCanvas, game: GameEngine, time: number) {
  const ch = game.canvasHeight || game.height;

  // --- Background ---
  if (game.backgroundImage) {
    const computed = drawBackgroundImage(canvas, game.backgroundImage, game.width, ch);
    if (computed) {
      game.bgLayout = computed;
    }
  } else {
    canvas.drawRect({ x: 0, y: 0, width: game.width, height: ch }, game.skyPaint());
  }

  const bg = game.bgLayout;
  if (!bg) return;

  // --- Characters (depth-sorted by wy) ---
  const entities: { kind: string; entity: Worker | Boss; sort: number }[] = [
    ...game.workers.map((w) => ({ kind: 'worker', entity: w, sort: w.wy })),
    { kind: 'boss', entity: game.boss, sort: game.boss.wy },
  ];
  entities.sort((a, b) => a.sort - b.sort);

  for (const { kind, entity } of entities) {
    if (kind === 'worker') {
      drawCharacterAtPos(canvas, entity as Worker, bg, time);
    } else {
      const boss = entity as Boss;
      if (boss.active) {
        drawBossAtPos(canvas, boss, bg, time);
      }
    }
  }

  // --- Effects ---
  for (const e of game.effects) {
    if (!e.to || !bg) continue;
    const p = e.t / e.duration;
    drawEffect(
      canvas,
      e,
      normToScreen(e.from.wx, e.from.wy, bg),
      normToScreen(e.to.wx, e.to.wy, bg),
      p,
    );
  }
}
