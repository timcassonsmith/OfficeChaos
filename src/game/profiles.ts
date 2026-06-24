export type CharacterSex = 'male' | 'female';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface CharacterProfile {
  name: string;
  sex: CharacterSex;
  hairColor: string;
  skinColor: string;
  outfitColor: string;
  pantsColor: string;
  /** Optional override — one of the sheet character sprites */
  spriteId?: string;
}

export const HAIR_COLORS = [
  { id: 'black', color: '#1a1a1a', label: 'Black' },
  { id: 'brown', color: '#5c3a1e', label: 'Brown' },
  { id: 'red', color: '#c0392b', label: 'Red' },
  { id: 'blonde', color: '#d4a017', label: 'Blonde' },
  { id: 'grey', color: '#7f8c8d', label: 'Grey' },
  { id: 'purple', color: '#8e44ad', label: 'Purple' },
];

export const SKIN_COLORS = [
  { id: 'light', color: '#ffe0bd', label: 'Light' },
  { id: 'fair', color: '#ffdbac', label: 'Fair' },
  { id: 'medium', color: '#e0ac69', label: 'Medium' },
  { id: 'tan', color: '#c68642', label: 'Tan' },
  { id: 'brown', color: '#8d5524', label: 'Brown' },
  { id: 'dark', color: '#5c3d2e', label: 'Dark' },
];

export const OUTFIT_COLORS = [
  { id: 'blue', color: '#3498db', label: 'Blue' },
  { id: 'red', color: '#e74c3c', label: 'Red' },
  { id: 'green', color: '#2ecc71', label: 'Green' },
  { id: 'white', color: '#ecf0f1', label: 'White' },
  { id: 'yellow', color: '#f1c40f', label: 'Yellow' },
  { id: 'pink', color: '#fd79a8', label: 'Pink' },
  { id: 'navy', color: '#2c3e50', label: 'Navy' },
  { id: 'orange', color: '#e67e22', label: 'Orange' },
];

export const PANTS_COLORS = [
  { id: 'black', color: '#1a1a1a', label: 'Black' },
  { id: 'navy', color: '#2c3e50', label: 'Navy' },
  { id: 'grey', color: '#636e72', label: 'Grey' },
  { id: 'brown', color: '#4a3728', label: 'Brown' },
  { id: 'blue', color: '#2980b9', label: 'Blue' },
];

export const DEFAULT_PROFILES: CharacterProfile[] = [
  { name: 'Alex', sex: 'male', hairColor: '#1a1a1a', skinColor: '#c68642', outfitColor: '#636e72', pantsColor: '#1a1a1a', spriteId: 'male_dark' },
  { name: 'Sam', sex: 'female', hairColor: '#c0392b', skinColor: '#ffe0bd', outfitColor: '#3498db', pantsColor: '#1a1a1a', spriteId: 'female_red' },
  { name: 'Jordan', sex: 'male', hairColor: '#5c3a1e', skinColor: '#ffdbac', outfitColor: '#ecf0f1', pantsColor: '#2c3e50', spriteId: 'male_red' },
  { name: 'Riley', sex: 'female', hairColor: '#1a1a1a', skinColor: '#ffe0bd', outfitColor: '#e74c3c', pantsColor: '#1a1a1a', spriteId: 'female_black' },
  { name: 'Casey', sex: 'male', hairColor: '#7f8c8d', skinColor: '#e0ac69', outfitColor: '#ecf0f1', pantsColor: '#1a1a1a', spriteId: 'male_grey' },
  { name: 'Morgan', sex: 'female', hairColor: '#8e44ad', skinColor: '#ffdbac', outfitColor: '#2ecc71', pantsColor: '#1a1a1a', spriteId: 'female_red' },
];

export function cloneProfiles(profiles: CharacterProfile[]): CharacterProfile[] {
  return profiles.map((p) => ({ ...p }));
}
