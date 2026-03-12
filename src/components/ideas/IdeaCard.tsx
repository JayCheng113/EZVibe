'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Idea } from '@/lib/types';
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';

interface IdeaCardProps {
  idea: Idea;
  hasActiveSession?: boolean;
}

export default function IdeaCard({ idea, hasActiveSession }: IdeaCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSelected = pathname === `/idea/${idea.id}`;
  const stageColor = STAGE_COLORS[idea.stage];

  return (
    <button
      onClick={() => router.push(`/idea/${idea.id}`)}
      className={`w-full text-left border-l-4 px-3 py-2.5 transition-colors ${
        isSelected
          ? 'bg-gray-200 dark:bg-gray-800'
          : 'bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
      }`}
      style={{ borderLeftColor: stageColor }}
    >
      <div className="flex items-center gap-2">
        {hasActiveSession && (
          <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400" />
        )}
        <span
          className="text-sm font-bold truncate"
          style={{ color: idea.color || stageColor }}
        >
          {idea.name}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: stageColor + '22',
            color: stageColor,
          }}
        >
          {STAGE_LABELS[idea.stage]}
        </span>
      </div>
      {idea.description && (
        <p className="mt-1 text-xs text-gray-500 truncate">{idea.description}</p>
      )}
    </button>
  );
}
