'use client';

import { STAGES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { Stage } from '@/lib/constants';

interface StageFilterProps {
  activeStage: string | null;
  onStageChange: (stage: string | null) => void;
}

export default function StageFilter({ activeStage, onStageChange }: StageFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2">
      <button
        onClick={() => onStageChange(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          activeStage === null
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
      >
        All
      </button>
      {STAGES.map((stage: Stage) => (
        <button
          key={stage}
          onClick={() => onStageChange(stage)}
          className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor:
              activeStage === stage ? STAGE_COLORS[stage] : undefined,
            color: activeStage === stage ? '#fff' : STAGE_COLORS[stage],
            border: `1px solid ${STAGE_COLORS[stage]}`,
            opacity: activeStage === stage ? 1 : 0.7,
          }}
        >
          {STAGE_LABELS[stage]}
        </button>
      ))}
    </div>
  );
}
