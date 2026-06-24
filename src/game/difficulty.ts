import type { Difficulty } from './profiles';

export interface DifficultySettings {
  id: Difficulty;
  label: string;
  description: string;
  drowsyRate: number;
  drowsyDelayMin: number;
  drowsyDelayMax: number;
  progressDecaySleep: number;
  bossSpeed: number;
  bossTriggerProgress: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    description: 'Sleepy workers nod off slowly. Boss takes his time.',
    drowsyRate: 2.2,
    drowsyDelayMin: 7,
    drowsyDelayMax: 12,
    progressDecaySleep: 5,
    bossSpeed: 0.055,
    bossTriggerProgress: 28,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'Balanced shift — stay alert!',
    drowsyRate: 3.5,
    drowsyDelayMin: 4,
    drowsyDelayMax: 8,
    progressDecaySleep: 8,
    bossSpeed: 0.08,
    bossTriggerProgress: 35,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'Workers crash fast. Boss is on the warpath.',
    drowsyRate: 5,
    drowsyDelayMin: 2,
    drowsyDelayMax: 5,
    progressDecaySleep: 12,
    bossSpeed: 0.11,
    bossTriggerProgress: 45,
  },
};
