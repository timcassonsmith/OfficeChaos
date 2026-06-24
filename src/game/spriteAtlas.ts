import type { CharacterProfile } from './profiles';

/** Pixel rects on office-sprites.png (602×512) */
export interface SpriteFrame {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export const SPRITE_SHEET_SIZE = { w: 256, h: 160 };

export const CHARACTER_SPRITES: SpriteFrame[] = [
  { id: 'male_dark', x: 3, y: 32, w: 48, h: 74, label: 'Dark hair · blue shirt' },
  { id: 'male_red', x: 53, y: 32, w: 48, h: 74, label: 'Red hair · white shirt' },
  { id: 'male_grey', x: 103, y: 32, w: 48, h: 74, label: 'Grey hair · glasses' },
  { id: 'female_red', x: 153, y: 32, w: 48, h: 74, label: 'Red hair · blue top' },
  { id: 'female_black', x: 203, y: 32, w: 48, h: 74, label: 'Black hair · red top' },
];

export const BOSS_SPRITE_ID = 'male_grey';

const SPRITE_BY_ID = Object.fromEntries(CHARACTER_SPRITES.map((s) => [s.id, s]));

export function getSpriteFrame(id: string): SpriteFrame {
  return SPRITE_BY_ID[id] ?? CHARACTER_SPRITES[0];
}

function colorMatch(hex: string, targets: string[]) {
  const h = hex.toLowerCase();
  return targets.some((t) => h.includes(t) || t.includes(h));
}

/** Map custom profile colours to the closest sheet character */
export function pickSpriteId(profile: CharacterProfile, index: number): string {
  if (profile.spriteId) return profile.spriteId;

  const hair = profile.hairColor.toLowerCase();
  const outfit = profile.outfitColor.toLowerCase();

  if (profile.sex === 'female') {
    if (colorMatch(hair, ['c03', 'e74', 'red', '924', 'a855'])) return 'female_red';
    return 'female_black';
  }

  if (colorMatch(hair, ['7f8', '94a', 'grey', '647'])) return 'male_grey';
  if (colorMatch(hair, ['c03', '924', '5c3', 'brown', 'd4a'])) return 'male_red';
  if (colorMatch(outfit, ['636', '647', '475'])) return 'male_dark';

  const defaults = ['male_dark', 'female_red', 'male_red', 'female_black', 'male_grey', 'female_red'];
  return defaults[index % defaults.length];
}

export function spriteOptionsForSetup(): SpriteFrame[] {
  return CHARACTER_SPRITES;
}
