'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { Idea } from '@/lib/types';

interface PlanFile {
  filename: string;
  title: string;
  content: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PlanTab({ idea: _idea }: { idea: Idea }) {
  const { data: plans, isLoading } = useSWR<PlanFile[]>('/api/claude/plans', fetcher);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return <p className="p-4 text-sm text-gray-500">Loading plans...</p>;
  }

  if (!plans || plans.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No plans found.</p>;
  }

  return (
    <div className="space-y-1 p-2">
      {plans.map(plan => (
        <div key={plan.filename}>
          <button
            onClick={() => setExpanded(expanded === plan.filename ? null : plan.filename)}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <span className="text-gray-500">{expanded === plan.filename ? '▾' : '▸'}</span>
            <span className="truncate text-gray-800 dark:text-gray-200">{plan.title}</span>
            <span className="ml-auto text-xs text-gray-600">{plan.filename}</span>
          </button>
          {expanded === plan.filename && (
            <pre className="mx-3 mb-2 max-h-80 overflow-auto rounded bg-gray-100 dark:bg-gray-900/50 p-3 text-xs text-gray-700 dark:text-gray-300">
              {plan.content}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
