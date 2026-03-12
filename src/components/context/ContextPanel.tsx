'use client';

import { useState } from 'react';
import type { Idea } from '@/lib/types';
import ClaudemdTab from './ClaudemdTab';
import MemoryTab from './MemoryTab';
import NotesTab from './NotesTab';
import UsageTab from './UsageTab';

type Tab = 'instructions' | 'memory' | 'notes' | 'usage';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'instructions', label: 'Instructions', icon: '📝' },
  { key: 'memory', label: 'Memory', icon: '🧠' },
  { key: 'notes', label: 'Notes', icon: '📒' },
  { key: 'usage', label: 'Token', icon: '📊' },
];

export default function ContextPanel({ idea }: { idea: Idea }) {
  const [activeTab, setActiveTab] = useState<Tab>('instructions');

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-default)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex shrink-0 gap-1 px-3 pt-2 pb-0"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-all duration-150"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
              }}
            >
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </button>
          );
        })}
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
