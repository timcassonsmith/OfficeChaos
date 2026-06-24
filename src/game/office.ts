import {
  BOSS_BOUNDS,
  DESK_POSITIONS,
  MAIN_BOUNDS,
  OFFICE_MAP,
  POI,
} from './officeMap';

export { OFFICE_MAP, DESK_POSITIONS, POI, MAIN_BOUNDS, BOSS_BOUNDS };

export function isWalkable(gx: number, gy: number): boolean {
  const x = Math.round(gx);
  const y = Math.round(gy);
  if (x < 0 || y < 0 || x >= OFFICE_MAP[0].length || y >= OFFICE_MAP.length) return false;
  return OFFICE_MAP[y][x]?.walkable === true;
}
