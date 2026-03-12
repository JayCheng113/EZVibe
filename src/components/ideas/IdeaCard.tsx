'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Idea } from '@/lib/types';
import { STAGE_LABELS, STAGE_COLORS, STAGE_COLORS_LIGHT, STAGE_ICONS } from '@/lib/constants';

interface IdeaCardProps {
  idea: Idea;
  hasActiveSession?: boolean;
}

export default function IdeaCard({ idea, hasActiveSession }: IdeaCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSelected = pathname === `/idea/${idea.id}`;
  const stageColor = STAGE_COLORS[idea.stage];
  const stageColorLight = STAGE_COLORS_LIGHT[idea.stage];
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const displayColor = isDark ? stageColor : stageColorLight;

  return (
    <button
      onClick={() => router.push(`/idea/${idea.id}`)}
      className="focus-ring group relative w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150"
      style={{
        background: isSelected ? 'var(--bg-active)' : 'transparent',
        ...(isSelected && {
          boxShadow: `inset 3px 0 0 ${displayColor}`,
        }),
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xs leading-none">{STAGE_ICONS[idea.stage]}</span>
        <span
          className="flex-1 truncate text-[13px] font-medium"
          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {idea.name}
        </span>
        {hasActiveSession && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: '#4ade80' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
          </span>
        )}
        <span
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: displayColor + '15',
            color: displayColor,
          }}
        >
          {STAGE_LABELS[idea.stage]}
        </span>
      </div>
      {idea.description && (
        <p
          className="mt-1 truncate pl-[26px] text-[11px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {idea.description}
        </p>
      )}
    </button>
  );
}
