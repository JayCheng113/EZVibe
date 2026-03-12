'use client';

import type { Idea } from '@/lib/types';
import { STAGE_LABELS, STAGE_COLORS, STAGE_COLORS_LIGHT, STAGE_ICONS } from '@/lib/constants';
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
  const stageColorLight = STAGE_COLORS_LIGHT[idea.stage];
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const displayColor = isDark ? stageColor : stageColorLight;
  const isAlive = sessionId !== null && sessionStatus !== 'dead' && sessionStatus !== 'none';

  const statusLabel: Record<string, string> = {
    active: 'Active',
    waiting: 'Waiting for input',
    idle: 'Idle',
    dead: 'Session ended',
    starting: 'Starting...',
  };

  const badgeStatus = (['active', 'waiting', 'idle', 'dead'].includes(sessionStatus)
    ? sessionStatus
    : sessionStatus === 'starting'
      ? 'active'
      : 'none') as 'active' | 'waiting' | 'idle' | 'dead' | 'none';

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">{STAGE_ICONS[idea.stage]}</span>
          <h2
            className="text-[13px] font-semibold truncate max-w-[200px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {idea.name}
          </h2>
        </div>
        <span
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: displayColor + '15',
            color: displayColor,
          }}
        >
          {STAGE_LABELS[idea.stage]}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={badgeStatus} />
          {(isAlive || sessionStatus === 'dead') && (
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {statusLabel[sessionStatus] || sessionStatus}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-3.5 w-px" style={{ background: 'var(--border-default)' }} />

        <button
          onClick={onEditIdea}
          className="rounded-md px-2 py-0.5 text-[11px] transition-all duration-150"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          title="Edit idea"
        >
          Edit
        </button>
        <button
          onClick={onDeleteIdea}
          className="rounded-md px-2 py-0.5 text-[11px] transition-all duration-150"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          title="Remove from EZVibe (files on disk are NOT deleted)"
        >
          Remove
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isAlive ? (
          !idea.projectPath ? (
            <button
              onClick={onEditIdea}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{ background: '#d97706' }}
            >
              Set Project Path
            </button>
          ) : (
            <button
              onClick={onCreateSession}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{ background: 'var(--accent)' }}
              title="Start Claude Code session"
            >
              Start Claude Code
            </button>
          )
        ) : (
          <button
            onClick={onKillSession}
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
            }}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
