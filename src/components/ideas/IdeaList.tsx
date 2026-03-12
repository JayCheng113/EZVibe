'use client';

import { useState } from 'react';
import { useIdeas } from '@/hooks/useIdeas';
import IdeaCard from './IdeaCard';
import StageFilter from '../common/StageFilter';

export default function IdeaList() {
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const { ideas, isLoading } = useIdeas(stageFilter || undefined);

  return (
    <div className="flex flex-col gap-0.5">
      <StageFilter activeStage={stageFilter} onStageChange={setStageFilter} />
      <div className="flex flex-col gap-0.5">
        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--accent-subtle)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No ideas yet</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Create your first idea to get started</p>
          </div>
        ) : (
          ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  );
}
