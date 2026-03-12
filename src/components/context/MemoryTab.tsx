'use client';

import useSWR from 'swr';
import type { Idea } from '@/lib/types';

interface MemoryFile {
  name: string;
  content: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MemoryTab({ idea }: { idea: Idea }) {
  const { data: files, isLoading } = useSWR<MemoryFile[]>(
    idea.claudeProjectKey
      ? `/api/claude/memory/${idea.claudeProjectKey}`
      : null,
    fetcher
  );

  if (!idea.claudeProjectKey) {
    return (
      <p className="p-4 text-sm text-gray-500">
        No project path configured. Set a project path to view memory files.
      </p>
    );
  }

  if (isLoading) {
    return <p className="p-4 text-sm text-gray-500">Loading memory files...</p>;
  }

  if (!files || files.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No memory files found.</p>;
  }

  return (
    <div className="space-y-3 p-2">
      {files.map(file => (
        <div key={file.name}>
          <h4 className="px-3 py-1 text-xs font-medium text-gray-400">{file.name}</h4>
          <pre className="mx-3 max-h-60 overflow-auto rounded bg-gray-900/50 p-3 text-xs text-gray-300">
            {file.content}
          </pre>
        </div>
      ))}
    </div>
  );
}
