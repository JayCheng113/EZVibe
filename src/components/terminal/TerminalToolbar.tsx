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
}

export default function TerminalToolbar({
  idea,
  sessionId,
  sessionStatus,
  onCreateSession,
  onKillSession,
}: TerminalToolbarProps) {
  const stageColor = STAGE_COLORS[idea.stage];
  const isActive = sessionId !== null && sessionStatus !== 'dead' && sessionStatus !== 'none';
  const isStarting = sessionStatus === 'starting';

  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-100 truncate max-w-[200px]">
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
      </div>

      <div className="flex items-center gap-2">
        {!isActive ? (
          !idea.projectPath ? (
            <span className="text-xs text-yellow-400">
              Please edit this idea and set a project path first
            </span>
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
