import { Platform } from 'react-native';
import { GRID_H, GRID_W, TILE_H, TILE_W, WALL_H } from './constants';

export interface SafeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface LayoutMetrics {
  hudH: number;
  sidePanelW: number;
  canvasW: number;
  canvasH: number;
  scale: number;
  landscape: boolean;
  insets: SafeInsets;
}

/** Extra padding on the edge where Android 3-button nav sits in landscape. */
export function androidNavPadding(insets: SafeInsets, width: number, height: number): SafeInsets {
  if (Platform.OS !== 'android') return insets;

  const landscape = width >= height;
  const minNav = 52;

  if (landscape) {
    return {
      ...insets,
      right: Math.max(insets.right, minNav),
      left: Math.max(insets.left, 8),
      bottom: Math.max(insets.bottom, 4),
    };
  }

  return {
    ...insets,
    bottom: Math.max(insets.bottom, minNav),
    left: Math.max(insets.left, 8),
    right: Math.max(insets.right, 8),
  };
}

export function getLayoutMetrics(
  width: number,
  height: number,
  showActions: boolean,
  rawInsets: SafeInsets = { left: 0, right: 0, top: 0, bottom: 0 },
): LayoutMetrics {
  const insets = androidNavPadding(rawInsets, width, height);
  const landscape = width >= height;
  const shortSide = Math.min(width, height);

  const hudH = shortSide < 340 ? 44 : shortSide < 400 ? 50 : 58;
  const sidePanelW = showActions ? (shortSide < 340 ? 108 : shortSide < 420 ? 120 : 132) : 0;

  const canvasW = width - sidePanelW - insets.left - insets.right;
  const canvasH = height - hudH - insets.top - insets.bottom;

  const mapW = (GRID_W + GRID_H) * (TILE_W / 2);
  const mapH = (GRID_W + GRID_H) * (TILE_H / 2) + WALL_H;
  const scale = Math.min(canvasW / mapW, canvasH / mapH) * 0.94;

  return {
    hudH,
    sidePanelW,
    canvasW: Math.max(100, canvasW),
    canvasH: Math.max(100, canvasH),
    scale: Math.max(0.45, scale),
    landscape,
    insets,
  };
}
