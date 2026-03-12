'use client';

import { STAGES, STAGE_LABELS, STAGE_COLORS, STAGE_COLORS_LIGHT, STAGE_ICONS } from '@/lib/constants';
import type { Stage } from '@/lib/constants';

interface StageFilterProps {
  activeStage: string | null;
  onStageChange: (stage: string | null) => void;
}

export default function StageFilter({ activeStage, onStageChange }: StageFilterProps) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="flex flex-wrap gap-1.5 px-1 py-2">
      <button
        onClick={() => onStageChange(null)}
        className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
        style={{
          background: activeStage === null ? 'var(--bg-active)' : 'transparent',
          color: activeStage === null ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
      >
        All
      </button>
      {STAGES.map((stage: Stage) => {
        const color = isDark ? STAGE_COLORS[stage] : STAGE_COLORS_LIGHT[stage];
        const isActive = activeStage === stage;
        return (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
            style={{
              background: isActive ? color + '20' : 'transparent',
              color: isActive ? color : 'var(--text-tertiary)',
            }}
          >
            <span className="text-[10px]">{STAGE_ICONS[stage]}</span>
            {STAGE_LABELS[stage]}
          </button>
        );
      })}
    </div>
  );
}
