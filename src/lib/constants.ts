import type { Idea } from './types';

export type Stage = Idea['stage'];

export const STAGES = ['exploring', 'planning', 'implementing', 'done'] as const;

export const STAGE_LABELS: Record<Stage, string> = {
  exploring: '探索',
  planning: '规划',
  implementing: '实现',
  done: '完成',
};

export const STAGE_COLORS: Record<Stage, string> = {
  exploring: '#b39ddb',
  planning: '#e94560',
  implementing: '#00d4ff',
  done: '#4caf50',
};

// Darker variants for light theme readability
export const STAGE_COLORS_LIGHT: Record<Stage, string> = {
  exploring: '#7e57c2',
  planning: '#c62828',
  implementing: '#0097a7',
  done: '#2e7d32',
};

export const STAGE_ICONS: Record<Stage, string> = {
  exploring: '💬',
  planning: '📋',
  implementing: '⚡',
  done: '✅',
};
