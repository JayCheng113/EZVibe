'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import IdeaList from '../ideas/IdeaList';
import IdeaForm from '../ideas/IdeaForm';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar() {
  const [showForm, setShowForm] = useState(false);
  const { mutate } = useSWRConfig();

  const handleSaved = () => {
    mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/ideas'),
      undefined,
      { revalidate: true }
    );
  };

  return (
    <aside className="flex h-full flex-col" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            E
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            EZVibe
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            beta
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => setShowForm(true)}
            className="focus-ring flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: 'var(--accent)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New
          </button>
        </div>
      </div>

      {/* Idea list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <IdeaList />
      </div>

      <IdeaForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSaved={handleSaved}
      />
    </aside>
  );
}
