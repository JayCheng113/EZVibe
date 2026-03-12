'use client';

import type { Idea } from '@/lib/types';
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import StatusBadge from '@/components/common/StatusBadge';

interface TerminalToolbarProps {
  idea: Idea;
  sessionId: string | null;
  sessionStatus: string;
  onCreateSession: () => void;
  onKillSession: () => void;
  onEditIdea: () => void;
  onDeleteIdea: () => void;
}

export default function TerminalToolbar({
  idea,
  sessionId,
  sessionStatus,
  onCreateSession,
  onKillSession,
  onEditIdea,
  onDeleteIdea,
}: TerminalToolbarProps) {
  const stageColor = STAGE_COLORS[idea.stage];
  const isActive = sessionId !== null && sessionStatus !== 'dead' && sessionStatus !== 'none';
  const isStarting = sessionStatus === 'starting';

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/80 px-4 py-2">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
          {idea.name}
        </h2>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: stageColor + '22',
            color: stageColor,
          }}
        >
          {STAGE_LABELS[idea.stage]}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge
            status={isActive ? 'active' : sessionStatus === 'dead' ? 'dead' : 'none'}
          />
          {isActive && (
            <span className="text-[10px] text-gray-500">
              {isStarting ? 'Starting...' : 'Running'}
            </span>
          )}
        </div>
        <button
          onClick={onEditIdea}
          className="rounded px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Edit idea"
        >
          Edit
        </button>
        <button
          onClick={onDeleteIdea}
          className="rounded px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-400"
          title="Remove from EZVibe (files on disk are NOT deleted)"
        >
          Remove
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isActive ? (
          !idea.projectPath ? (
            <button
              onClick={onEditIdea}
              className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-yellow-500"
            >
              Set Project Path
            </button>
          ) : (
            <button
              onClick={onCreateSession}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
              title="Start Claude Code session"
            >
              Start Claude Code
            </button>
          )
        ) : (
          <button
            onClick={onKillSession}
            className="rounded bg-red-600/80 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
