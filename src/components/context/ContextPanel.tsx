'use client';

import { useState } from 'react';
import type { Idea } from '@/lib/types';
import ClaudemdTab from './ClaudemdTab';
import MemoryTab from './MemoryTab';
import NotesTab from './NotesTab';
import UsageTab from './UsageTab';

type Tab = 'instructions' | 'memory' | 'notes' | 'usage';

const TABS: { key: Tab; label: string }[] = [
  { key: 'instructions', label: 'Instructions' },
  { key: 'memory', label: '记忆' },
  { key: 'notes', label: '笔记' },
  { key: 'usage', label: 'Token' },
];

export default function ContextPanel({ idea }: { idea: Idea }) {
  const [activeTab, setActiveTab] = useState<Tab>('instructions');

  return (
    <div className="flex h-full flex-col border-t border-gray-800 bg-gray-950">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-gray-800">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'instructions' && <ClaudemdTab idea={idea} />}
        {activeTab === 'memory' && <MemoryTab idea={idea} />}
        {activeTab === 'notes' && <NotesTab idea={idea} />}
        {activeTab === 'usage' && <UsageTab />}
      </div>
    </div>
  );
}
