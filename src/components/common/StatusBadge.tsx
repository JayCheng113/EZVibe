'use client';

interface StatusBadgeProps {
  status: 'active' | 'waiting' | 'idle' | 'dead' | 'none';
}

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  waiting: '#fbbf24',
  idle: '#22c55e',
  dead: '#6b7280',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'none') return null;

  const color = STATUS_COLORS[status] || '#6b7280';
  const shouldPulse = status === 'active' || status === 'waiting';

  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {shouldPulse && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
          style={{ background: color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}
