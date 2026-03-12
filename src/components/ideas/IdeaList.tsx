'use client';

import { useState } from 'react';
import { useIdeas } from '@/hooks/useIdeas';
import IdeaCard from './IdeaCard';
import StageFilter from '../common/StageFilter';

export default function IdeaList() {
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const { ideas, isLoading } = useIdeas(stageFilter || undefined);

  return (
    <div className="flex flex-col">
      <StageFilter activeStage={stageFilter} onStageChange={setStageFilter} />
      <div className="flex flex-col">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : ideas.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No ideas yet. Create your first idea!
          </div>
        ) : (
          ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  );
}
