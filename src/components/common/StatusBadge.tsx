'use client';

interface StatusBadgeProps {
  status: 'active' | 'dead' | 'none';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'none') return null;

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === 'active' ? 'animate-pulse bg-green-400' : 'bg-red-500'
      }`}
    />
  );
}
