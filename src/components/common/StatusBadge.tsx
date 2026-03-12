'use client';

interface StatusBadgeProps {
  status: 'active' | 'waiting' | 'idle' | 'dead' | 'none';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'none') return null;

  const styles: Record<string, string> = {
    active: 'animate-pulse bg-green-400',
    waiting: 'animate-pulse bg-yellow-400',
    idle: 'bg-green-700',
    dead: 'bg-gray-500',
  };

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${styles[status] || 'bg-gray-500'}`}
    />
  );
}
